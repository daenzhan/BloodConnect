package org.example.bloodconnect_monolit.analysis;

import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/analyses")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalysisController {

    @Autowired
    private AnalysisRepository analysisRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private BloodCenterRepository bloodCenterRepository;

    // Создать анализ для донации (автоматически при старте донации)
    @PostMapping("/create-for-donation/{donationId}")
    public ResponseEntity<?> createAnalysisForDonation(@PathVariable Long donationId,
                                                       @RequestParam Long bloodCenterId) {
        try {
            Optional<Donation> donationOpt = donationRepository.findById(donationId);
            if (donationOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Donation not found"));
            }

            Optional<BloodCenter> bloodCenterOpt = bloodCenterRepository.findById(bloodCenterId);
            if (bloodCenterOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Blood center not found"));
            }

            // Проверяем, не существует ли уже анализ
            Optional<Analysis> existingAnalysis = analysisRepository.findByDonation_DonationId(donationId);
            if (existingAnalysis.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "message", "Analysis already exists",
                        "analysisId", existingAnalysis.get().getAnalysisId(),
                        "status", existingAnalysis.get().getStatus()
                ));
            }

            Analysis analysis = new Analysis();
            analysis.setDonation(donationOpt.get());
            analysis.setBloodCenter(bloodCenterOpt.get());
            analysis.setStatus("PENDING");
            analysis.setAnalysisDate(LocalDateTime.now());

            Analysis savedAnalysis = analysisRepository.save(analysis);

            return ResponseEntity.ok(Map.of(
                    "message", "Analysis created successfully",
                    "analysisId", savedAnalysis.getAnalysisId(),
                    "status", savedAnalysis.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить анализ по ID
    @GetMapping("/{analysisId}")
    public ResponseEntity<?> getAnalysisById(@PathVariable Long analysisId) {
        try {
            Optional<Analysis> analysis = analysisRepository.findById(analysisId);
            if (analysis.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(analysis.get());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить анализ по donationId
    @GetMapping("/donation/{donationId}")
    public ResponseEntity<?> getAnalysisByDonation(@PathVariable Long donationId) {
        try {
            Optional<Analysis> analysis = analysisRepository.findByDonation_DonationId(donationId);
            if (analysis.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "exists", false,
                        "message", "No analysis found for this donation"
                ));
            }
            return ResponseEntity.ok(analysis.get());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить все анализы для blood center
    @GetMapping("/bloodcenter/{bloodCenterId}")
    public ResponseEntity<?> getAnalysesByBloodCenter(@PathVariable Long bloodCenterId) {
        try {
            List<Analysis> analyses = analysisRepository.findByBloodCenter_BloodCenterId(bloodCenterId);
            return ResponseEntity.ok(analyses);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить анализы по статусу для blood center
    @GetMapping("/bloodcenter/{bloodCenterId}/status/{status}")
    public ResponseEntity<?> getAnalysesByBloodCenterAndStatus(@PathVariable Long bloodCenterId,
                                                               @PathVariable String status) {
        try {
            List<Analysis> analyses = analysisRepository.findByBloodCenterAndStatus(bloodCenterId, status);
            return ResponseEntity.ok(analyses);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Полностью обновить анализ
    @PutMapping("/{analysisId}")
    public ResponseEntity<?> updateAnalysis(@PathVariable Long analysisId,
                                            @RequestBody Map<String, Object> analysisData) {
        try {
            Optional<Analysis> analysisOpt = analysisRepository.findById(analysisId);
            if (analysisOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Analysis not found"));
            }

            Analysis analysis = analysisOpt.get();

            // Обновляем поля, если они переданы
            if (analysisData.containsKey("hiv")) analysis.setHiv((String) analysisData.get("hiv"));
            if (analysisData.containsKey("brucellosis")) analysis.setBrucellosis((String) analysisData.get("brucellosis"));
            if (analysisData.containsKey("hepatitisB")) analysis.setHepatitisB((String) analysisData.get("hepatitisB"));
            if (analysisData.containsKey("hepatitisC")) analysis.setHepatitisC((String) analysisData.get("hepatitisC"));
            if (analysisData.containsKey("syphilis")) analysis.setSyphilis((String) analysisData.get("syphilis"));
            if (analysisData.containsKey("altLevel")) analysis.setAltLevel(Double.valueOf(analysisData.get("altLevel").toString()));
            if (analysisData.containsKey("bloodGroup")) analysis.setBloodGroup((String) analysisData.get("bloodGroup"));
            if (analysisData.containsKey("rhesusFactor")) analysis.setRhesusFactor((String) analysisData.get("rhesusFactor"));
            if (analysisData.containsKey("hemoglobin")) analysis.setHemoglobin(Double.valueOf(analysisData.get("hemoglobin").toString()));
            if (analysisData.containsKey("technicianNotes")) analysis.setTechnicianNotes((String) analysisData.get("technicianNotes"));

            // Проверяем, все ли поля заполнены
            if (analysis.isComplete()) {
                analysis.setStatus("COMPLETED");

                // Обновляем статус донации на основе eligibility
                Donation donation = analysis.getDonation();
                if (analysis.isDonorEligible()) {
                    donation.setStatus("APPROVED");
                } else {
                    donation.setStatus("REJECTED");
                }
                donationRepository.save(donation);
            } else {
                // Если хотя бы одно поле заполнено, меняем статус с PENDING на IN_PROGRESS
                if ("PENDING".equals(analysis.getStatus()) && hasAnyFieldFilled(analysisData)) {
                    analysis.setStatus("IN_PROGRESS");
                }
            }

            analysis.setAnalysisDate(LocalDateTime.now());
            Analysis savedAnalysis = analysisRepository.save(analysis);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Analysis updated successfully");
            response.put("analysisId", savedAnalysis.getAnalysisId());
            response.put("status", savedAnalysis.getStatus());
            response.put("isComplete", savedAnalysis.isComplete());

            if (savedAnalysis.isComplete()) {
                response.put("isDonorEligible", savedAnalysis.isDonorEligible());
                response.put("donationStatus", savedAnalysis.getDonation().getStatus());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Частичное обновление (по одному полю)
    @PatchMapping("/{analysisId}")
    public ResponseEntity<?> patchAnalysis(@PathVariable Long analysisId,
                                           @RequestBody Map<String, Object> updateFields) {
        try {
            Optional<Analysis> analysisOpt = analysisRepository.findById(analysisId);
            if (analysisOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Analysis not found"));
            }

            Analysis analysis = analysisOpt.get();
            boolean wasPending = "PENDING".equals(analysis.getStatus());
            boolean hasChanges = false;

            for (Map.Entry<String, Object> entry : updateFields.entrySet()) {
                switch (entry.getKey()) {
                    case "hiv":
                        analysis.setHiv((String) entry.getValue());
                        hasChanges = true;
                        break;
                    case "brucellosis":
                        analysis.setBrucellosis((String) entry.getValue());
                        hasChanges = true;
                        break;
                    case "hepatitisB":
                        analysis.setHepatitisB((String) entry.getValue());
                        hasChanges = true;
                        break;
                    case "hepatitisC":
                        analysis.setHepatitisC((String) entry.getValue());
                        hasChanges = true;
                        break;
                    case "syphilis":
                        analysis.setSyphilis((String) entry.getValue());
                        hasChanges = true;
                        break;
                    case "altLevel":
                        analysis.setAltLevel(Double.valueOf(entry.getValue().toString()));
                        hasChanges = true;
                        break;
                    case "bloodGroup":
                        analysis.setBloodGroup((String) entry.getValue());
                        hasChanges = true;
                        break;
                    case "rhesusFactor":
                        analysis.setRhesusFactor((String) entry.getValue());
                        hasChanges = true;
                        break;
                    case "hemoglobin":
                        analysis.setHemoglobin(Double.valueOf(entry.getValue().toString()));
                        hasChanges = true;
                        break;
                    case "technicianNotes":
                        analysis.setTechnicianNotes((String) entry.getValue());
                        hasChanges = true;
                        break;
                }
            }

            if (hasChanges) {
                // Проверяем completeness
                if (analysis.isComplete()) {
                    analysis.setStatus("COMPLETED");
                    Donation donation = analysis.getDonation();
                    if (analysis.isDonorEligible()) {
                        donation.setStatus("APPROVED");
                    } else {
                        donation.setStatus("REJECTED");
                    }
                    donationRepository.save(donation);
                } else if (wasPending) {
                    analysis.setStatus("IN_PROGRESS");
                }

                analysis.setAnalysisDate(LocalDateTime.now());
                Analysis savedAnalysis = analysisRepository.save(analysis);
                return ResponseEntity.ok(savedAnalysis);
            }

            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Удалить анализ (если ошибка)
    @DeleteMapping("/{analysisId}")
    public ResponseEntity<?> deleteAnalysis(@PathVariable Long analysisId) {
        try {
            if (!analysisRepository.existsById(analysisId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Analysis not found"));
            }
            analysisRepository.deleteById(analysisId);
            return ResponseEntity.ok(Map.of("message", "Analysis deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить статистику анализов для blood center
    @GetMapping("/bloodcenter/{bloodCenterId}/stats")
    public ResponseEntity<?> getAnalysisStats(@PathVariable Long bloodCenterId) {
        try {
            List<Analysis> analyses = analysisRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            long pending = analyses.stream().filter(a -> "PENDING".equals(a.getStatus())).count();
            long inProgress = analyses.stream().filter(a -> "IN_PROGRESS".equals(a.getStatus())).count();
            long completed = analyses.stream().filter(a -> "COMPLETED".equals(a.getStatus())).count();
            long eligible = analyses.stream().filter(a -> "COMPLETED".equals(a.getStatus()) && a.isDonorEligible()).count();
            long notEligible = completed - eligible;

            Map<String, Object> stats = new HashMap<>();
            stats.put("total", analyses.size());
            stats.put("pending", pending);
            stats.put("inProgress", inProgress);
            stats.put("completed", completed);
            stats.put("eligible", eligible);
            stats.put("notEligible", notEligible);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private boolean hasAnyFieldFilled(Map<String, Object> data) {
        return data.containsKey("hiv") || data.containsKey("brucellosis") ||
                data.containsKey("hepatitisB") || data.containsKey("hepatitisC") ||
                data.containsKey("syphilis") || data.containsKey("altLevel") ||
                data.containsKey("bloodGroup") || data.containsKey("rhesusFactor") ||
                data.containsKey("hemoglobin");
    }
}