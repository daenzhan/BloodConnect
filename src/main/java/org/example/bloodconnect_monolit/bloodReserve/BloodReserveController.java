package org.example.bloodconnect_monolit.bloodreserve;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.analysis.Analysis;
import org.example.bloodconnect_monolit.analysis.AnalysisRepository;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/blood-reserves")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class BloodReserveController {

    private final BloodReserveRepository bloodReserveRepository;
    private final DonationRepository donationRepository;
    private final AnalysisRepository analysisRepository;
    private final BloodCenterRepository bloodCenterRepository;

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
}