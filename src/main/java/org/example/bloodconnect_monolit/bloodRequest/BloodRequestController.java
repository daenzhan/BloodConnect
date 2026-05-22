package org.example.bloodconnect_monolit.bloodRequest;

import org.example.bloodconnect_monolit.bloodreserve.BloodReserve;
import org.example.bloodconnect_monolit.bloodreserve.BloodReserveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/blood-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class BloodRequestController {

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @Autowired
    private BloodReserveRepository bloodReserveRepository;

    @PostMapping("/create")
    public ResponseEntity<BloodRequest> createBloodRequest(@RequestBody BloodRequest request) {
        try {
            System.out.println("Received request: " + request);

            if (request.getBloodCenter() == null || request.getBloodCenter().getBloodCenterId() == null) {
                return ResponseEntity.badRequest().build();
            }

            request.setStatus("PENDING");
            request.setCreateAt(LocalDateTime.now());

            BloodRequest savedRequest = bloodRequestRepository.save(request);
            System.out.println("Saved request with ID: " + savedRequest.getBloodRequestId());

            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
            System.err.println("Error creating request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/medcenter/{medCenterId}")
    public ResponseEntity<List<BloodRequest>> getRequestsByMedCenter(@PathVariable Long medCenterId) {
        List<BloodRequest> requests = bloodRequestRepository.findByMedCenter_MedCenterId(medCenterId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BloodRequest> getRequestById(@PathVariable Long id) {
        return bloodRequestRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BloodRequest> updateRequest(@PathVariable Long id, @RequestBody BloodRequest updatedRequest) {
        return bloodRequestRepository.findById(id)
                .map(request -> {
                    request.setComponentType(updatedRequest.getComponentType());
                    request.setBloodGroup(updatedRequest.getBloodGroup());
                    request.setRhesusFactor(updatedRequest.getRhesusFactor());
                    request.setVolume(updatedRequest.getVolume());
                    request.setDeadline(updatedRequest.getDeadline());
                    request.setComment(updatedRequest.getComment());
                    return ResponseEntity.ok(bloodRequestRepository.save(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BloodRequest> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return bloodRequestRepository.findById(id)
                .map(request -> {
                    request.setStatus(status);
                    return ResponseEntity.ok(bloodRequestRepository.save(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        if (bloodRequestRepository.existsById(id)) {
            bloodRequestRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/bloodcenter/{bloodCenterId}")
    public ResponseEntity<List<BloodRequest>> getRequestsByBloodCenter(@PathVariable Long bloodCenterId) {
        return ResponseEntity.ok(bloodRequestRepository.findByBloodCenter_BloodCenterId(bloodCenterId));
    }

    @GetMapping("/bloodcenter/{bloodCenterId}/pending/count")
    public ResponseEntity<?> getPendingRequestsCount(@PathVariable Long bloodCenterId) {
        try {
            long count = bloodRequestRepository.countByBloodCenter_BloodCenterIdAndStatus(
                    bloodCenterId, "PENDING"
            );
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ДЕБАГ: просмотр всех резервов
    @GetMapping("/debug/reserves/{bloodCenterId}")
    public ResponseEntity<?> debugReserves(@PathVariable Long bloodCenterId) {
        try {
            List<BloodReserve> reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            List<Map<String, Object>> debug = new ArrayList<>();
            for (BloodReserve reserve : reserves) {
                Map<String, Object> info = new HashMap<>();
                info.put("reserveId", reserve.getReserveId());
                info.put("componentType", reserve.getComponentType());
                info.put("bloodGroup", reserve.getBloodGroup());
                info.put("rhesusFactor", reserve.getRhesusFactor());
                info.put("quantity", reserve.getQuantity());
                info.put("isAvailable", reserve.getIsAvailable());
                info.put("inQuarantine", reserve.getInQuarantine());
                info.put("expirationDate", reserve.getExpirationDate());
                info.put("isExpired", reserve.getExpirationDate().isBefore(LocalDateTime.now()));
                debug.add(info);
            }

            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ПРОВЕРКА ДОСТУПНОСТИ (с улучшенным логированием)
    @GetMapping("/{requestId}/check-availability")
    public ResponseEntity<?> checkAvailability(@PathVariable Long requestId) {
        try {
            Optional<BloodRequest> requestOpt = bloodRequestRepository.findById(requestId);
            if (requestOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Blood request not found"));
            }

            BloodRequest request = requestOpt.get();
            int requestedVolume = parseVolume(request.getVolume());

            System.out.println("=== CHECKING AVAILABILITY ===");
            System.out.println("Request ID: " + requestId);
            System.out.println("Component: " + request.getComponentType());
            System.out.println("Blood Group: " + request.getBloodGroup());
            System.out.println("Rhesus Factor: " + request.getRhesusFactor());
            System.out.println("Requested Volume: " + requestedVolume);
            System.out.println("Blood Center ID: " + request.getBloodCenter().getBloodCenterId());

            List<BloodReserve> suitableReserves = bloodReserveRepository.findSuitableReserves(
                    request.getBloodCenter().getBloodCenterId(),
                    request.getComponentType(),
                    request.getBloodGroup(),
                    request.getRhesusFactor(),
                    LocalDateTime.now()
            );

            System.out.println("Found suitable reserves: " + suitableReserves.size());
            for (BloodReserve reserve : suitableReserves) {
                System.out.println("  - Reserve " + reserve.getReserveId() +
                        ": " + reserve.getComponentType() +
                        ", " + reserve.getBloodGroup() +
                        reserve.getRhesusFactor() +
                        ", qty=" + reserve.getQuantity() +
                        ", available=" + reserve.getIsAvailable() +
                        ", quarantine=" + reserve.getInQuarantine());
            }

            int totalAvailable = suitableReserves.stream()
                    .mapToInt(BloodReserve::getQuantity)
                    .sum();

            Map<String, Object> response = new HashMap<>();
            response.put("requestedVolume", requestedVolume);
            response.put("totalAvailable", totalAvailable);
            response.put("isFulfillable", totalAvailable >= requestedVolume);
            response.put("availableReservesCount", suitableReserves.size());

            List<Map<String, Object>> reserveDetails = new ArrayList<>();
            for (BloodReserve reserve : suitableReserves) {
                Map<String, Object> details = new HashMap<>();
                details.put("reserveId", reserve.getReserveId());
                details.put("quantity", reserve.getQuantity());
                details.put("expirationDate", reserve.getExpirationDate());
                details.put("daysUntilExpiration",
                        ChronoUnit.DAYS.between(LocalDateTime.now(), reserve.getExpirationDate()));
                reserveDetails.add(details);
            }
            response.put("reserves", reserveDetails);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ВЫПОЛНЕНИЕ ЗАЯВКИ
    @PostMapping("/{requestId}/execute")
    @Transactional
    public ResponseEntity<?> executeBloodRequest(@PathVariable Long requestId) {
        try {
            Optional<BloodRequest> requestOpt = bloodRequestRepository.findById(requestId);
            if (requestOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Blood request not found"));
            }

            BloodRequest request = requestOpt.get();

            if (!"PENDING".equals(request.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot execute request with status: " + request.getStatus()
                ));
            }

            int requestedVolume = parseVolume(request.getVolume());
            if (requestedVolume <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid volume format"));
            }

            System.out.println("=== EXECUTING REQUEST ===");
            System.out.println("Request ID: " + requestId);
            System.out.println("Requested Volume: " + requestedVolume);

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

            int remainingToFulfill = requestedVolume;
            int usedReservesCount = 0;
            List<Map<String, Object>> usedReserves = new ArrayList<>();

            for (BloodReserve reserve : suitableReserves) {
                if (remainingToFulfill <= 0) break;

                int availableQuantity = reserve.getQuantity();
                int takenQuantity = Math.min(availableQuantity, remainingToFulfill);

                reserve.setQuantity(availableQuantity - takenQuantity);
                bloodReserveRepository.save(reserve);

                System.out.println("Took " + takenQuantity + " ml from reserve " + reserve.getReserveId() +
                        " (had " + availableQuantity + ", now " + reserve.getQuantity() + ")");

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

            if (remainingToFulfill > 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Insufficient blood quantity",
                        "requestedVolume", requestedVolume,
                        "fulfilledVolume", requestedVolume - remainingToFulfill,
                        "missingVolume", remainingToFulfill
                ));
            }

            request.setStatus("COMPLETED");
            bloodRequestRepository.save(request);

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
        if (volumeStr == null || volumeStr.isEmpty()) return 0;
        String digits = volumeStr.replaceAll("[^0-9.]", "");
        if (digits.isEmpty()) return 0;

        double volume = Double.parseDouble(digits);

        if (volumeStr.toLowerCase().contains("l") && !volumeStr.toLowerCase().contains("ml")) {
            volume *= 1000;
        }

        return (int) volume;
    }
}