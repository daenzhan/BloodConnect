package org.example.bloodconnect_monolit.donorCall;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.donor.DonorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DonorCallService {

    private final DonorRepository donorRepository;
    private final DonorCallRepository donorCallRepository;
    private final BloodCenterRepository bloodCenterRepository;
    private final DonorEmailNotificationService emailNotificationService;

    private static final int DONATION_INTERVAL_DAYS = 60;
    private static final int RECENT_CALL_DAYS = 30;

    @Transactional
    public Map<String, Object> callDonors(
            Long bloodCenterId,
            String bloodGroup,
            String rhesusFactor,
            String componentType,
            Integer requestedDonorsCount,
            String urgencyLevel,
            String customMessage) {

        // Валидация входных параметров
        if (bloodCenterId == null) {
            throw new IllegalArgumentException("Blood center ID is required");
        }
        if (bloodGroup == null || bloodGroup.trim().isEmpty()) {
            throw new IllegalArgumentException("Blood group is required");
        }
        if (rhesusFactor == null || rhesusFactor.trim().isEmpty()) {
            throw new IllegalArgumentException("Rhesus factor is required");
        }
        if (componentType == null || componentType.trim().isEmpty()) {
            throw new IllegalArgumentException("Component type is required");
        }

        BloodCenter bloodCenter = bloodCenterRepository.findById(bloodCenterId)
                .orElseThrow(() -> new RuntimeException("Blood center not found with ID: " + bloodCenterId));

        // Дефолтные значения
        if (requestedDonorsCount == null || requestedDonorsCount < 1) {
            requestedDonorsCount = 10;
        }
        if (urgencyLevel == null || urgencyLevel.trim().isEmpty()) {
            urgencyLevel = "NORMAL";
        }

        LocalDate minDonationInterval = LocalDate.now().minusDays(DONATION_INTERVAL_DAYS);

        log.info("Calling donors for blood center: {} ({}), blood type: {}{}",
                bloodCenter.getName(), bloodCenter.getCity(), bloodGroup,
                rhesusFactor.equalsIgnoreCase("POSITIVE") ? "+" : "-");

        List<Donor> eligibleDonors = donorRepository.findEligibleDonorsForCall(
                bloodCenter.getCity(),
                bloodGroup,
                rhesusFactor,
                minDonationInterval
        );

        if (eligibleDonors.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "No eligible donors found in city: " + bloodCenter.getCity());
            response.put("city", bloodCenter.getCity());
            response.put("bloodType", bloodGroup + (rhesusFactor.equalsIgnoreCase("POSITIVE") ? "+" : "-"));
            return response;
        }

        log.info("Found {} eligible donors in {}", eligibleDonors.size(), bloodCenter.getCity());

        // 2. Исключаем недавно вызванных
        LocalDateTime recentCallThreshold = LocalDateTime.now().minusDays(RECENT_CALL_DAYS);
        List<Long> donorIds = eligibleDonors.stream().map(Donor::getDonorId).toList();
        List<Long> recentlyCalledIds = donorCallRepository.findRecentlyCalledDonorIds(recentCallThreshold, donorIds);
        Set<Long> recentlyCalledSet = new HashSet<>(recentlyCalledIds);

        List<Donor> finalDonors = eligibleDonors.stream()
                .filter(d -> !recentlyCalledSet.contains(d.getDonorId()))
                .limit(requestedDonorsCount)
                .toList();

        if (finalDonors.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "All eligible donors were called recently. Please try again later.");
            response.put("eligibleCount", eligibleDonors.size());
            response.put("recentlyCalledCount", recentlyCalledSet.size());
            return response;
        }

        // 3. Создаем вызовы и отправляем уведомления
        String callMessage = buildCallMessage(urgencyLevel, bloodCenter, bloodGroup, rhesusFactor, componentType, customMessage);

        List<DonorCall> createdCalls = new ArrayList<>();
        int notifiedCount = 0;
        int emailSentCount = 0;

        for (Donor donor : finalDonors) {
            DonorCall call = new DonorCall();
            call.setDonorId(donor.getDonorId());
            call.setBloodCenter(bloodCenter);
            call.setBloodGroup(bloodGroup);
            call.setRhesusFactor(rhesusFactor);
            call.setComponentType(componentType);
            call.setMessage(callMessage);
            call.setStatus("PENDING");

            DonorCall savedCall = donorCallRepository.save(call);
            createdCalls.add(savedCall);
            notifiedCount++;

            // Отправляем email
            try {
                emailNotificationService.sendDonationCallEmail(donor, savedCall, urgencyLevel);
                emailSentCount++;
                log.info("Email sent to donor: {}", donor.getUser().getEmail());
            } catch (Exception e) {
                log.error("Failed to send email to donor {}: {}", donor.getDonorId(), e.getMessage());
            }
        }

        log.info("Donor call completed: {} donors notified, {} emails sent", notifiedCount, emailSentCount);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Donor call initiated successfully");
        response.put("bloodCenterId", bloodCenter.getBloodCenterId());
        response.put("bloodCenterName", bloodCenter.getName());
        response.put("city", bloodCenter.getCity());
        response.put("bloodType", bloodGroup + (rhesusFactor.equalsIgnoreCase("POSITIVE") ? "+" : "-"));
        response.put("componentType", componentType);
        response.put("requestedCount", requestedDonorsCount);
        response.put("eligibleFound", eligibleDonors.size());
        response.put("notifiedCount", notifiedCount);
        response.put("emailSentCount", emailSentCount);
        response.put("urgencyLevel", urgencyLevel);
        response.put("createdCallsCount", createdCalls.size());
        return response;
    }

    private String buildCallMessage(String urgencyLevel, BloodCenter bloodCenter,
                                    String bloodGroup, String rhesusFactor,
                                    String componentType, String customMessage) {
        String prefix = "URGENT".equals(urgencyLevel) ? "URGENT! " : "";
        String bloodType = bloodGroup + (rhesusFactor.equalsIgnoreCase("POSITIVE") ? "+" : "-");

        StringBuilder message = new StringBuilder(prefix);
        message.append("Blood donation required. Center: ").append(bloodCenter.getName())
                .append(" (").append(bloodCenter.getCity()).append("). ")
                .append("Blood type: ").append(bloodType).append(". ")
                .append("Component: ").append(formatComponentForMessage(componentType));

        if (customMessage != null && !customMessage.trim().isEmpty()) {
            message.append(". ").append(customMessage);
        }

        return message.toString();
    }

    private String formatComponentForMessage(String componentType) {
        switch (componentType) {
            case "WHOLE_BLOOD": return "Whole blood";
            case "RED_BLOOD_CELLS": return "Red blood cells";
            case "PLATELETS": return "Platelets";
            case "PLASMA": return "Plasma";
            case "CRYOPRECIPITATE": return "Cryoprecipitate";
            default: return componentType.toLowerCase();
        }
    }

    @Transactional
    public Map<String, Object> respondToCall(Long callId, Long donorId, String response) {
        DonorCall call = donorCallRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found with ID: " + callId));

        if (!call.getDonorId().equals(donorId)) {
            throw new RuntimeException("This call does not belong to the donor");
        }

        if (!"PENDING".equals(call.getStatus())) {
            throw new RuntimeException("Call is no longer pending. Status: " + call.getStatus());
        }

        if (call.getExpiresAt().isBefore(LocalDateTime.now())) {
            call.setStatus("EXPIRED");
            donorCallRepository.save(call);
            throw new RuntimeException("Call has expired");
        }

        call.setResponse(response);
        call.setRespondedAt(LocalDateTime.now());
        call.setStatus("ACCEPTED".equals(response) ? "ACCEPTED" : "DECLINED");

        donorCallRepository.save(call);

        log.info("Donor {} responded to call {} with: {}", donorId, callId, response);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Response recorded successfully");
        result.put("callId", callId);
        result.put("response", response);
        result.put("status", call.getStatus());
        return result;
    }

    @Transactional
    public void expireExpiredCalls() {
        List<DonorCall> expiredCalls = donorCallRepository.findByStatusAndExpiresAtBefore("PENDING", LocalDateTime.now());

        for (DonorCall call : expiredCalls) {
            call.setStatus("EXPIRED");
            donorCallRepository.save(call);
        }

        if (!expiredCalls.isEmpty()) {
            log.info("Expired {} donor calls", expiredCalls.size());
        }
    }

    public List<Map<String, Object>> getDonorCalls(Long donorId) {
        List<DonorCall> calls = donorCallRepository.findByDonorIdAndStatus(donorId, "PENDING");

        List<Map<String, Object>> result = new ArrayList<>();
        for (DonorCall call : calls) {
            Map<String, Object> callInfo = new HashMap<>();
            callInfo.put("callId", call.getId());
            callInfo.put("bloodCenterName", call.getBloodCenter().getName());
            callInfo.put("bloodCenterCity", call.getBloodCenter().getCity());
            callInfo.put("bloodType", call.getBloodGroup() +
                    (call.getRhesusFactor().equalsIgnoreCase("POSITIVE") ? "+" : "-"));
            callInfo.put("componentType", call.getComponentType());
            callInfo.put("message", call.getMessage());
            callInfo.put("expiresAt", call.getExpiresAt());
            callInfo.put("createdAt", call.getCreatedAt());
            result.add(callInfo);
        }

        return result;
    }

    public Map<String, Object> getCallHistoryForBloodCenter(Long bloodCenterId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<DonorCall> calls = donorCallRepository.findByBloodCenter_BloodCenterIdAndCreatedAtAfter(bloodCenterId, since);

        long pendingCount = calls.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
        long acceptedCount = calls.stream().filter(c -> "ACCEPTED".equals(c.getStatus())).count();
        long declinedCount = calls.stream().filter(c -> "DECLINED".equals(c.getStatus())).count();
        long expiredCount = calls.stream().filter(c -> "EXPIRED".equals(c.getStatus())).count();

        Map<String, Object> history = new HashMap<>();
        history.put("totalCalls", calls.size());
        history.put("pending", pendingCount);
        history.put("accepted", acceptedCount);
        history.put("declined", declinedCount);
        history.put("expired", expiredCount);
        history.put("calls", calls.stream().limit(100).toList());
        return history;
    }
}