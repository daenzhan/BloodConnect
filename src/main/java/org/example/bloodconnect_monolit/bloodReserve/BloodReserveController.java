package org.example.bloodconnect_monolit.bloodReserve;

import jakarta.transaction.Transactional;
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
import java.time.temporal.ChronoUnit;
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
                return ResponseEntity.badRequest().body(Map.of("error", "analysis not found"));
            }

            Analysis analysis = analysisOpt.get();

            if (!"APPROVED".equals(analysis.getStatus()) && !analysis.isDonorEligible()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "cannot create blood reserve from rejected analysis"
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
            response.put("message", "blood reserve created successfully");
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
                return ResponseEntity.badRequest().body(Map.of("error", "blood center not found"));
            }

            Long systemDonorId = 1L;
            Long systemDonationId = System.currentTimeMillis(); // возвращает миллисекунды

            BloodReserve reserve = new BloodReserve();
            reserve.setComponentType(componentType);
            reserve.setBloodGroup(bloodGroup);
            reserve.setRhesusFactor(rhesusFactor.equals("+") ? "POSITIVE" : "NEGATIVE");
            reserve.setQuantity(quantity);
            reserve.setDonationId(systemDonationId);
            reserve.setDonorId(systemDonorId);
            reserve.setBloodCenter(bloodCenterOpt.get());
            reserve.setNotes(notes != null ? notes : "manually added to inventory");
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
            response.put("message", "component added successfully");
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
            response.put("message", "quantity updated successfully");
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
                    "message", "reserve deleted successfully",
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

            // 500 ml -> 500
            int requestedVolume = parseVolume(request.getVolume());

            List<BloodReserve> suitableReserves = bloodReserveRepository.findSuitableReserves(
                    request.getBloodCenter().getBloodCenterId(),
                    request.getComponentType(),
                    request.getBloodGroup(),
                    request.getRhesusFactor(),
                    LocalDateTime.now()
            );

            if (suitableReserves.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "no suitable blood reserves found for this request"
                ));
            }

            // FIFO
            int remainingToFulfill = requestedVolume;
            int usedReservesCount = 0;
            List<Map<String, Object>> usedReserves = new java.util.ArrayList<>();

            for (BloodReserve reserve : suitableReserves) {
                if (remainingToFulfill <= 0) break;

                int availableQuantity = reserve.getQuantity();
                int takenQuantity = Math.min(availableQuantity, remainingToFulfill);

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

            // удалось ли полностью выполнить заявку
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
        String digits = volumeStr.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return 0;

        int volume = Integer.parseInt(digits);

        if (volumeStr.toLowerCase().contains("l") && !volumeStr.toLowerCase().contains("ml")) {
            volume *= 1000;
        }

        return volume;
    }

    @GetMapping("/bloodcenter/{bloodCenterId}/grouped")
    public ResponseEntity<?> getGroupedReserves(@PathVariable Long bloodCenterId) {
        try {
            List<BloodReserve> reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            // фильтрация - только доступные, не в карантине и не просроченные
            List<BloodReserve> availableReserves = reserves.stream()
                    .filter(r -> r.getIsAvailable() && !r.getInQuarantine() &&
                            r.getExpirationDate().isAfter(LocalDateTime.now()) &&
                            r.getQuantity() > 0)
                    .collect(Collectors.toList());

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

    // Получить все резервы в карантине
    @GetMapping("/quarantine/{bloodCenterId}")
    public ResponseEntity<?> getQuarantineReserves(@PathVariable Long bloodCenterId) {
        try {
            List<BloodReserve> quarantineReserves = bloodReserveRepository
                    .findByBloodCenter_BloodCenterIdAndInQuarantineTrue(bloodCenterId);

            // Фильтруем только те, где карантин еще не закончился или плазма
            List<Map<String, Object>> result = new ArrayList<>();
            for (BloodReserve reserve : quarantineReserves) {
                Map<String, Object> item = new HashMap<>();
                item.put("reserveId", reserve.getReserveId());
                item.put("componentType", reserve.getComponentType());
                item.put("bloodGroup", reserve.getBloodGroup());
                item.put("rhesusFactor", reserve.getRhesusFactor());
                item.put("quantity", reserve.getQuantity());
                item.put("quarantineEndDate", reserve.getQuarantineEndDate());
                item.put("createdDate", reserve.getCreatedDate());
                item.put("donationId", reserve.getDonationId());
                item.put("donorId", reserve.getDonorId());
                item.put("notes", reserve.getNotes());

                // Рассчитываем оставшиеся дни карантина
                if (reserve.getQuarantineEndDate() != null) {
                    long daysRemaining = ChronoUnit.DAYS.between(
                            LocalDateTime.now(), reserve.getQuarantineEndDate()
                    );
                    item.put("daysRemaining", Math.max(0, daysRemaining));
                    item.put("isQuarantineExpired", daysRemaining <= 0);
                } else {
                    item.put("daysRemaining", 0);
                    item.put("isQuarantineExpired", false);
                }

                result.add(item);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Ручной вывод из карантина (для плазмы)
    @PostMapping("/{reserveId}/release-from-quarantine")
    @Transactional
    public ResponseEntity<?> releaseFromQuarantine(@PathVariable Long reserveId) {
        try {
            Optional<BloodReserve> reserveOpt = bloodReserveRepository.findById(reserveId);
            if (reserveOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reserve not found"));
            }

            BloodReserve reserve = reserveOpt.get();

            if (!reserve.getInQuarantine()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reserve is not in quarantine"));
            }

            // Выводим из карантина
            reserve.setInQuarantine(false);
            reserve.setQuarantineEndDate(null);

            // Для плазмы: после вывода из карантина все равно нужна проверка
            if ("PLASMA".equals(reserve.getComponentType())) {
                reserve.setIsAvailable(false); // Становится доступной только после подтверждения
                reserve.setNotes((reserve.getNotes() != null ? reserve.getNotes() + "; " : "") +
                        "Released from quarantine manually on " + LocalDateTime.now());
            } else {
                reserve.setIsAvailable(true);
            }

            bloodReserveRepository.save(reserve);

            // Для плазмы возвращаем флаг, что нужна проверка
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Reserve released from quarantine");
            response.put("reserveId", reserveId);
            response.put("needsTesting", "PLASMA".equals(reserve.getComponentType()));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Подтверждение пригодности плазмы (после выхода из карантина)
    @PostMapping("/{reserveId}/confirm-plasma-suitability")
    @Transactional
    public ResponseEntity<?> confirmPlasmaSuitability(
            @PathVariable Long reserveId,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<BloodReserve> reserveOpt = bloodReserveRepository.findById(reserveId);
            if (reserveOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reserve not found"));
            }

            BloodReserve reserve = reserveOpt.get();

            String isSuitable = (String) request.get("isSuitable");
            String testResults = (String) request.get("testResults");
            String technicianNotes = (String) request.get("technicianNotes");

            if ("YES".equals(isSuitable)) {
                // ПЛАЗМА СТАНОВИТСЯ ДОСТУПНОЙ
                reserve.setIsAvailable(true);
                reserve.setNotes((reserve.getNotes() != null ? reserve.getNotes() + "; " : "") +
                        "Plasma confirmed suitable on " + LocalDateTime.now() +
                        ". Test results: " + testResults +
                        (technicianNotes != null ? ". Notes: " + technicianNotes : ""));
            } else {
                // НЕПРИГОДНАЯ ПЛАЗМА - УДАЛЯЕМ ИЗ ИНВЕНТАРЯ
                reserve.setIsAvailable(false);
                reserve.setQuantity(0); // Обнуляем количество
                reserve.setNotes((reserve.getNotes() != null ? reserve.getNotes() + "; " : "") +
                        "Plasma marked as unsuitable on " + LocalDateTime.now() +
                        ". Reason: " + testResults +
                        (technicianNotes != null ? ". Notes: " + technicianNotes : ""));
            }

            bloodReserveRepository.save(reserve);

            return ResponseEntity.ok(Map.of(
                    "message", isSuitable.equals("YES") ? "Plasma marked as suitable and now available" : "Plasma marked as unsuitable and removed from inventory",
                    "isAvailable", reserve.getIsAvailable()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Автоматическая проверка и вывод из карантина (для запланированного задания)
    @PostMapping("/auto-release-expired-quarantine")
    public ResponseEntity<?> autoReleaseExpiredQuarantine() {
        try {
            List<BloodReserve> quarantineReserves = bloodReserveRepository
                    .findByInQuarantineTrue();

            int released = 0;
            int needsTesting = 0;

            for (BloodReserve reserve : quarantineReserves) {
                if (reserve.getQuarantineEndDate() != null &&
                        reserve.getQuarantineEndDate().isBefore(LocalDateTime.now())) {

                    reserve.setInQuarantine(false);
                    reserve.setQuarantineEndDate(null);

                    if ("PLASMA".equals(reserve.getComponentType())) {
                        reserve.setIsAvailable(false); // Требует проверки
                        needsTesting++;
                    } else {
                        reserve.setIsAvailable(true);
                    }

                    bloodReserveRepository.save(reserve);
                    released++;
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Auto-release completed",
                    "releasedCount", released,
                    "needsTestingCount", needsTesting
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}