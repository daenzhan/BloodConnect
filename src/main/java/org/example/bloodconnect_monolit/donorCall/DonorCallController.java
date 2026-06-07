package org.example.bloodconnect_monolit.donorCall;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.donor.DonorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/donor-calls")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class DonorCallController {

    private final DonorCallService donorCallService;
    private final DonorRepository donorRepository;

    /**
     * Вызов доноров центром крови
     * POST /donor-calls/call?bloodCenterId=1&bloodGroup=A&rhesusFactor=POSITIVE&componentType=WHOLE_BLOOD&requestedDonorsCount=10&urgencyLevel=URGENT&customMessage=текст
     */
    @PostMapping("/call")
    public ResponseEntity<Map<String, Object>> callDonors(
            @RequestParam Long bloodCenterId,
            @RequestParam String bloodGroup,
            @RequestParam String rhesusFactor,
            @RequestParam String componentType,
            @RequestParam(required = false, defaultValue = "10") Integer requestedDonorsCount,
            @RequestParam(required = false, defaultValue = "NORMAL") String urgencyLevel,
            @RequestParam(required = false) String customMessage) {

        try {
            Map<String, Object> result = donorCallService.callDonors(
                    bloodCenterId, bloodGroup, rhesusFactor, componentType,
                    requestedDonorsCount, urgencyLevel, customMessage
            );

            if (Boolean.FALSE.equals(result.get("success"))) {
                return ResponseEntity.badRequest().body(result);
            }

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);

        } catch (Exception e) {
            log.error("Error calling donors: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    //получение активных вызовов для донора
    @GetMapping("/donor/{userId}/pending")
    public ResponseEntity<Map<String, Object>> getDonorPendingCalls(@PathVariable Long userId) {
        try {
            Donor donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Donor not found for user ID: " + userId));

            List<Map<String, Object>> calls = donorCallService.getDonorCalls(donor.getDonorId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("calls", calls);
            response.put("count", calls.size());
            response.put("donorId", donor.getDonorId()); // Возвращаем donorId для фронтенда

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting donor pending calls: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Ответ донора на вызов
     * POST /donor-calls/{callId}/respond?userId=123&response=ACCEPTED
     * Теперь принимаем userId вместо donorId
     */
    @PostMapping("/{callId}/respond")
    public ResponseEntity<Map<String, Object>> respondToCall(
            @PathVariable Long callId,
            @RequestParam Long userId,
            @RequestParam String response) {

        try {
            Donor donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Donor not found for user ID: " + userId));

            Long donorId = donor.getDonorId();
            log.info("User {} (donor {}) responding to call {}", userId, donorId, callId);

            Map<String, Object> result = donorCallService.respondToCall(callId, donorId, response);
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            log.error("Error responding to call: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Unexpected error responding to call: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Получить историю вызовов для центра крови
     * GET /donor-calls/blood-center/{bloodCenterId}/history?days=30
     */
    @GetMapping("/blood-center/{bloodCenterId}/history")
    public ResponseEntity<Map<String, Object>> getCallHistory(
            @PathVariable Long bloodCenterId,
            @RequestParam(required = false, defaultValue = "30") int days) {

        try {
            Map<String, Object> history = donorCallService.getCallHistoryForBloodCenter(bloodCenterId, days);
            history.put("success", true);
            return ResponseEntity.ok(history);

        } catch (Exception e) {
            log.error("Error getting call history: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Проверить, может ли донор сдавать кровь
     * GET /donor-calls/check-eligibility/{userId}
     */
    @GetMapping("/check-eligibility/{userId}")
    public ResponseEntity<Map<String, Object>> checkDonorEligibility(@PathVariable Long userId) {
        try {
            Donor donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Donor not found"));

            LocalDate minDonationInterval = LocalDate.now().minusDays(60);
            boolean isEligible = donorRepository.isDonorEligibleForDonation(donor.getDonorId(), minDonationInterval);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("isEligible", isEligible);
            response.put("donorId", donor.getDonorId());
            response.put("lastDonationDate", donor.getLastDonationDate());

            if (!isEligible && donor.getLastDonationDate() != null) {
                LocalDate nextEligibleDate = donor.getLastDonationDate().plusDays(60);
                response.put("nextEligibleDate", nextEligibleDate);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error checking eligibility: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/debug/eligible-donors")
    public ResponseEntity<?> debugEligibleDonors(
            @RequestParam String city,
            @RequestParam String bloodGroup,
            @RequestParam String rhesusFactor) {

        log.info("DEBUG: Checking eligible donors in city: {}, bloodGroup: {}, rhesusFactor: {}",
                city, bloodGroup, rhesusFactor);

        try {
            LocalDate minDonationInterval = LocalDate.now().minusDays(60);

            List<Donor> donors = donorRepository.findEligibleDonorsForCall(
                    city, bloodGroup, rhesusFactor, minDonationInterval
            );

            Map<String, Object> result = new HashMap<>();
            result.put("city", city);
            result.put("bloodType", bloodGroup + (rhesusFactor.equals("POSITIVE") ? "+" : "-"));
            result.put("count", donors.size());
            result.put("donors", donors.stream().limit(10).map(d -> {
                Map<String, Object> donorInfo = new HashMap<>();
                donorInfo.put("id", d.getDonorId());
                donorInfo.put("name", d.getFullName());
                donorInfo.put("lastDonation", d.getLastDonationDate());
                return donorInfo;
            }).toList());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error in debug endpoint: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}