package org.example.bloodconnect_monolit.bloodreserve;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.analysis.Analysis;
import org.example.bloodconnect_monolit.analysis.AnalysisRepository;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.bloodRequest.BloodRequest;
import org.example.bloodconnect_monolit.bloodRequest.BloodRequestRepository;
import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/blood-reserves")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class BloodReserveController {

    private final BloodReserveRepository bloodReserveRepository;
    private final DonationRepository donationRepository;
    private final AnalysisRepository analysisRepository;
    private final BloodCenterRepository bloodCenterRepository;
    private final BloodRequestRepository bloodRequestRepository;

    @PostMapping("/create-from-analysis/{analysisId}")
    public ResponseEntity<?> createFromAnalysis(
            @PathVariable Long analysisId,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<Analysis> analysisOpt = analysisRepository.findById(analysisId);
            if (analysisOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Analysis not found"));
            }

            Analysis analysis = analysisOpt.get();

            if (!"APPROVED".equals(analysis.getStatus()) && !analysis.isDonorEligible()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot create blood reserve from rejected analysis"
                ));
            }

            String componentType = (String) request.get("componentType");
            Integer quantity = request.get("quantity") != null ? (Integer) request.get("quantity") : 250;
            Boolean inQuarantine = request.get("inQuarantine") != null ? (Boolean) request.get("inQuarantine") : false;
            Integer quarantineDays = request.get("quarantineDays") != null ? (Integer) request.get("quarantineDays") : 0;
            String notes = (String) request.get("notes");

            BloodCenter bloodCenter = analysis.getBloodCenter();

            BloodReserve reserve = new BloodReserve();
            reserve.setComponentType(componentType);
            reserve.setBloodGroup(analysis.getBloodGroup());
            reserve.setRhesusFactor(analysis.getRhesusFactor());
            reserve.setQuantity(quantity);
            reserve.setDonationId(analysis.getDonation().getDonationId());
            reserve.setDonorId(analysis.getDonation().getDonor().getDonorId());
            reserve.setBloodCenter(bloodCenter);
            reserve.setAnalysisId(analysisId);
            reserve.setNotes(notes);

            if ("PLASMA".equals(componentType)) {
                reserve.setInQuarantine(inQuarantine);
                if (inQuarantine && quarantineDays > 0) {
                    reserve.setQuarantineEndDate(LocalDateTime.now().plusDays(quarantineDays));
                }
                reserve.setIsAvailable(false);
            } else {
                reserve.setInQuarantine(false);
                reserve.setIsAvailable(true);
                reserve.setQuarantineEndDate(null);
            }

            reserve.calculateExpirationDate();

            BloodReserve saved = bloodReserveRepository.save(reserve);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Blood reserve created successfully");
            response.put("reserveId", saved.getReserveId());
            response.put("donationId", saved.getDonationId());
            response.put("expirationDate", saved.getExpirationDate());
            response.put("quarantineEndDate", saved.getQuarantineEndDate());
            response.put("componentType", saved.getComponentType());
            response.put("bloodGroup", saved.getBloodGroup());
            response.put("rhesusFactor", saved.getRhesusFactor());
            response.put("quantity", saved.getQuantity());
            response.put("isAvailable", saved.getIsAvailable());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create-manual")
    public ResponseEntity<?> createManualReserve(@RequestBody Map<String, Object> request) {
        try {
            Long bloodCenterId = ((Number) request.get("bloodCenterId")).longValue();
            String componentType = (String) request.get("componentType");
            String bloodGroup = (String) request.get("bloodGroup");
            String rhesusFactor = (String) request.get("rhesusFactor");
            Integer quantity = (Integer) request.get("quantity");
            String notes = (String) request.get("notes");

            Optional<BloodCenter> bloodCenterOpt = bloodCenterRepository.findById(bloodCenterId);
            if (bloodCenterOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Blood center not found"));
            }

            Long systemDonorId = 1L;
            Long systemDonationId = System.currentTimeMillis();

            BloodReserve reserve = new BloodReserve();
            reserve.setComponentType(componentType);
            reserve.setBloodGroup(bloodGroup);
            reserve.setRhesusFactor(rhesusFactor.equals("+") ? "POSITIVE" : "NEGATIVE");
            reserve.setQuantity(quantity);
            reserve.setDonationId(systemDonationId);
            reserve.setDonorId(systemDonorId);
            reserve.setBloodCenter(bloodCenterOpt.get());
            reserve.setNotes(notes != null ? notes : "Manually added to inventory");
            reserve.setAnalysisId(0L);

            if ("PLASMA".equals(componentType)) {
                reserve.setInQuarantine(true);
                reserve.setQuarantineEndDate(LocalDateTime.now().plusDays(90));
                reserve.setIsAvailable(false);
            } else {
                reserve.setInQuarantine(false);
                reserve.setIsAvailable(true);
                reserve.setQuarantineEndDate(null);
            }

            reserve.calculateExpirationDate();

            BloodReserve saved = bloodReserveRepository.save(reserve);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Component added successfully");
            response.put("reserveId", saved.getReserveId());
            response.put("expirationDate", saved.getExpirationDate());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{reserveId}/quantity")
    public ResponseEntity<?> updateQuantity(@PathVariable Long reserveId, @RequestBody Map<String, Object> request) {
        try {
            Optional<BloodReserve> reserveOpt = bloodReserveRepository.findById(reserveId);
            if (reserveOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Reserve not found"));
            }

            BloodReserve reserve = reserveOpt.get();
            Integer newQuantity = (Integer) request.get("quantity");
            reserve.setQuantity(newQuantity);
            bloodReserveRepository.save(reserve);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Quantity updated successfully");
            response.put("quantity", newQuantity);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<?> getReservesByDonation(@PathVariable Long donationId) {
        try {
            List<BloodReserve> reserves = bloodReserveRepository.findByDonationId(donationId);

            List<Map<String, Object>> reservesList = new java.util.ArrayList<>();
            for (BloodReserve reserve : reserves) {
                Map<String, Object> map = new HashMap<>();
                map.put("reserveId", reserve.getReserveId());
                map.put("componentType", reserve.getComponentType());
                map.put("bloodGroup", reserve.getBloodGroup());
                map.put("rhesusFactor", reserve.getRhesusFactor());
                map.put("quantity", reserve.getQuantity());
                map.put("inQuarantine", reserve.getInQuarantine());
                map.put("quarantineEndDate", reserve.getQuarantineEndDate());
                map.put("isAvailable", reserve.getIsAvailable());
                map.put("expirationDate", reserve.getExpirationDate());
                map.put("createdDate", reserve.getCreatedDate());
                map.put("donationId", reserve.getDonationId());
                map.put("isReady", reserve.isReadyForDistribution());
                map.put("notes", reserve.getNotes());

                if (reserve.getInQuarantine() && reserve.getQuarantineEndDate() != null) {
                    long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                            LocalDateTime.now(), reserve.getQuarantineEndDate()
                    );
                    map.put("quarantineDaysRemaining", Math.max(0, daysRemaining));
                } else {
                    map.put("quarantineDaysRemaining", 0);
                }

                long daysUntilExpiration = java.time.temporal.ChronoUnit.DAYS.between(
                        LocalDateTime.now(), reserve.getExpirationDate()
                );
                map.put("daysUntilExpiration", Math.max(0, daysUntilExpiration));

                reservesList.add(map);
            }

            return ResponseEntity.ok(reservesList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bloodcenter/{bloodCenterId}")
    public ResponseEntity<?> getReservesByBloodCenter(@PathVariable Long bloodCenterId) {
        try {
            List<BloodReserve> reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            List<Map<String, Object>> reservesWithDetails = new java.util.ArrayList<>();
            for (BloodReserve reserve : reserves) {
                Map<String, Object> map = new HashMap<>();
                map.put("reserveId", reserve.getReserveId());
                map.put("componentType", reserve.getComponentType());
                map.put("bloodGroup", reserve.getBloodGroup());
                map.put("rhesusFactor", reserve.getRhesusFactor());
                map.put("quantity", reserve.getQuantity());
                map.put("inQuarantine", reserve.getInQuarantine());
                map.put("quarantineEndDate", reserve.getQuarantineEndDate());
                map.put("isAvailable", reserve.getIsAvailable());
                map.put("expirationDate", reserve.getExpirationDate());
                map.put("createdDate", reserve.getCreatedDate());
                map.put("donationId", reserve.getDonationId());
                map.put("isReady", reserve.isReadyForDistribution());
                map.put("notes", reserve.getNotes());

                long daysUntilExpiration = java.time.temporal.ChronoUnit.DAYS.between(
                        LocalDateTime.now(), reserve.getExpirationDate()
                );
                map.put("daysUntilExpiration", Math.max(0, daysUntilExpiration));

                if (reserve.getInQuarantine() && reserve.getQuarantineEndDate() != null) {
                    long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                            LocalDateTime.now(), reserve.getQuarantineEndDate()
                    );
                    map.put("quarantineDaysRemaining", Math.max(0, daysRemaining));
                } else {
                    map.put("quarantineDaysRemaining", 0);
                }

                reservesWithDetails.add(map);
            }

            return ResponseEntity.ok(reservesWithDetails);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{reserveId}")
    public ResponseEntity<?> deleteReserve(@PathVariable Long reserveId) {
        try {
            Optional<BloodReserve> reserveOpt = bloodReserveRepository.findById(reserveId);
            if (reserveOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            bloodReserveRepository.delete(reserveOpt.get());

            return ResponseEntity.ok(Map.of(
                    "message", "Reserve deleted successfully",
                    "reserveId", reserveId
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Добавьте в BloodRequestController.java
    @PostMapping("/{requestId}/execute")
    public ResponseEntity<?> executeBloodRequest(@PathVariable Long requestId) {
        try {
            // 1. Найти заявку
            Optional<BloodRequest> requestOpt = bloodRequestRepository.findById(requestId);
            if (requestOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Blood request not found"));
            }

            BloodRequest request = requestOpt.get();

            // 2. Проверить статус заявки
            if (!"PENDING".equals(request.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot execute request with status: " + request.getStatus()
                ));
            }

            // 3. Парсим объем из строки (например "500 ml" -> 500)
            int requestedVolume = parseVolume(request.getVolume());

            // 4. Найти подходящие резервы
            List<BloodReserve> suitableReserves = bloodReserveRepository.findSuitableReserves(
                    request.getBloodCenter().getBloodCenterId(),
                    request.getComponentType(),
                    request.getBloodGroup(),
                    request.getRhesusFactor(),
                    LocalDateTime.now()
            );

            if (suitableReserves.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "No suitable blood reserves found for this request"
                ));
            }

            // 5. Списать кровь из резервов (FIFO - сначала старые)
            int remainingToFulfill = requestedVolume;
            int usedReservesCount = 0;
            List<Map<String, Object>> usedReserves = new java.util.ArrayList<>();

            for (BloodReserve reserve : suitableReserves) {
                if (remainingToFulfill <= 0) break;

                int availableQuantity = reserve.getQuantity();
                int takenQuantity = Math.min(availableQuantity, remainingToFulfill);

                // Обновляем количество
                reserve.setQuantity(availableQuantity - takenQuantity);
                bloodReserveRepository.save(reserve);

                remainingToFulfill -= takenQuantity;
                usedReservesCount++;

                Map<String, Object> used = new HashMap<>();
                used.put("reserveId", reserve.getReserveId());
                used.put("quantityUsed", takenQuantity);
                used.put("remainingQuantity", reserve.getQuantity());
                used.put("componentType", reserve.getComponentType());
                used.put("bloodGroup", reserve.getBloodGroup());
                used.put("rhesusFactor", reserve.getRhesusFactor());
                usedReserves.add(used);
            }

            // 6. Проверить, удалось ли полностью выполнить заявку
            if (remainingToFulfill > 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Insufficient blood quantity",
                        "requestedVolume", requestedVolume,
                        "fulfilledVolume", requestedVolume - remainingToFulfill,
                        "missingVolume", remainingToFulfill
                ));
            }

            // 7. Обновить статус заявки
            request.setStatus("COMPLETED");
            bloodRequestRepository.save(request);

            // 8. Вернуть результат
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Blood request executed successfully");
            response.put("requestId", requestId);
            response.put("fulfilledVolume", requestedVolume);
            response.put("reservesUsed", usedReservesCount);
            response.put("usedReserves", usedReserves);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private int parseVolume(String volumeStr) {
        if (volumeStr == null) return 0;
        // Извлекаем число из строки типа "500 ml", "250ml", "1 L" и т.д.
        String digits = volumeStr.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return 0;

        int volume = Integer.parseInt(digits);

        // Если указано в литрах, конвертируем в мл
        if (volumeStr.toLowerCase().contains("l") && !volumeStr.toLowerCase().contains("ml")) {
            volume *= 1000;
        }

        return volume;
    }

    // В BloodReserveController.java добавьте этот метод
    @GetMapping("/bloodcenter/{bloodCenterId}/grouped")
    public ResponseEntity<?> getGroupedReserves(@PathVariable Long bloodCenterId) {
        try {
            List<BloodReserve> reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            // Фильтруем только доступные, не в карантине и не просроченные
            List<BloodReserve> availableReserves = reserves.stream()
                    .filter(r -> r.getIsAvailable() && !r.getInQuarantine() &&
                            r.getExpirationDate().isAfter(LocalDateTime.now()) &&
                            r.getQuantity() > 0)
                    .collect(Collectors.toList());

            // Группируем на бэкенде без отдельного DTO
            Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();

            for (BloodReserve reserve : availableReserves) {
                String key = reserve.getComponentType() + "_" +
                        reserve.getBloodGroup() + "_" +
                        reserve.getRhesusFactor();

                if (!grouped.containsKey(key)) {
                    Map<String, Object> group = new HashMap<>();
                    group.put("componentType", reserve.getComponentType());
                    group.put("bloodGroup", reserve.getBloodGroup());
                    group.put("rhesusFactor", reserve.getRhesusFactor());
                    group.put("totalQuantity", 0);
                    group.put("unitsCount", 0);
                    group.put("oldestExpiration", reserve.getExpirationDate());
                    group.put("newestExpiration", reserve.getExpirationDate());
                    group.put("reserves", new ArrayList<BloodReserve>());
                    grouped.put(key, group);
                }

                Map<String, Object> group = grouped.get(key);
                group.put("totalQuantity", (Integer)group.get("totalQuantity") + reserve.getQuantity());
                group.put("unitsCount", (Integer)group.get("unitsCount") + 1);
                ((List<BloodReserve>)group.get("reserves")).add(reserve);

                LocalDateTime oldest = (LocalDateTime) group.get("oldestExpiration");
                if (reserve.getExpirationDate().isBefore(oldest)) {
                    group.put("oldestExpiration", reserve.getExpirationDate());
                }

                LocalDateTime newest = (LocalDateTime) group.get("newestExpiration");
                if (reserve.getExpirationDate().isAfter(newest)) {
                    group.put("newestExpiration", reserve.getExpirationDate());
                }
            }

            return ResponseEntity.ok(new ArrayList<>(grouped.values()));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}