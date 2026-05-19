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

    // Создание анализа по donationId
    @PostMapping("/create-for-donation/{donationId}")
    public ResponseEntity<?> createAnalysisForDonation(
            @PathVariable Long donationId,
            @RequestParam Long bloodCenterId) {

        try {
            // Проверяем существует ли донация
            Optional<Donation> donationOpt = donationRepository.findById(donationId);
            if (donationOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Donation not found"));
            }

            Donation donation = donationOpt.get();

            // Проверяем, не существует ли уже анализ для этой донации
            Optional<Analysis> existingAnalysis = analysisRepository.findByDonation_DonationId(donationId);
            if (existingAnalysis.isPresent()) {
                return ResponseEntity.ok(existingAnalysis.get());
            }

            // Проверяем существование blood center
            Optional<BloodCenter> bloodCenterOpt = bloodCenterRepository.findById(bloodCenterId);
            if (bloodCenterOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Blood center not found"));
            }

            // Создаем новый анализ
            Analysis analysis = new Analysis();
            analysis.setDonation(donation);
            analysis.setBloodCenter(bloodCenterOpt.get());
            analysis.setStatus("PENDING");
            analysis.setAnalysisDate(LocalDateTime.now());

            // Инициализируем все поля как null (будут заполнены позже)
            analysis.setHiv(null);
            analysis.setBrucellosis(null);
            analysis.setHepatitisB(null);
            analysis.setHepatitisC(null);
            analysis.setSyphilis(null);
            analysis.setAltLevel(null);
            analysis.setBloodGroup(null);
            analysis.setRhesusFactor(null);
            analysis.setHemoglobin(null);
            analysis.setTechnicianNotes(null);

            Analysis savedAnalysis = analysisRepository.save(analysis);

            return ResponseEntity.ok(savedAnalysis);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create analysis: " + e.getMessage()));
        }
    }

    // Получение анализа по donationId
    @GetMapping("/donation/{donationId}")
    public ResponseEntity<?> getAnalysisByDonationId(@PathVariable Long donationId) {
        try {
            Optional<Analysis> analysisOpt = analysisRepository.findByDonation_DonationId(donationId);

            if (analysisOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("exists", false, "message", "Analysis not found"));
            }

            Analysis analysis = analysisOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("analysisId", analysis.getAnalysisId());
            response.put("status", analysis.getStatus());
            response.put("hiv", analysis.getHiv());
            response.put("brucellosis", analysis.getBrucellosis());
            response.put("hepatitisB", analysis.getHepatitisB());
            response.put("hepatitisC", analysis.getHepatitisC());
            response.put("syphilis", analysis.getSyphilis());
            response.put("altLevel", analysis.getAltLevel());
            response.put("bloodGroup", analysis.getBloodGroup());
            response.put("rhesusFactor", analysis.getRhesusFactor());
            response.put("hemoglobin", analysis.getHemoglobin());
            response.put("technicianNotes", analysis.getTechnicianNotes());
            response.put("analysisDate", analysis.getAnalysisDate());
            response.put("donationId", analysis.getDonation().getDonationId());
            response.put("bloodCenterId", analysis.getBloodCenter().getBloodCenterId());
            response.put("isComplete", analysis.isComplete());
            response.put("isDonorEligible", analysis.isComplete() ? analysis.isDonorEligible() : false);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch analysis: " + e.getMessage()));
        }
    }

    @PutMapping("/{analysisId}")
    public ResponseEntity<?> updateAnalysis(@PathVariable Long analysisId, @RequestBody Map<String, Object> updates) {
        try {
            Optional<Analysis> analysisOpt = analysisRepository.findById(analysisId);
            if (analysisOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Analysis analysis = analysisOpt.get();

            // Обновляем поля
            if (updates.containsKey("hiv")) analysis.setHiv((String) updates.get("hiv"));
            if (updates.containsKey("brucellosis")) analysis.setBrucellosis((String) updates.get("brucellosis"));
            if (updates.containsKey("hepatitisB")) analysis.setHepatitisB((String) updates.get("hepatitisB"));
            if (updates.containsKey("hepatitisC")) analysis.setHepatitisC((String) updates.get("hepatitisC"));
            if (updates.containsKey("syphilis")) analysis.setSyphilis((String) updates.get("syphilis"));
            if (updates.containsKey("altLevel")) analysis.setAltLevel(updates.get("altLevel") != null ? ((Number) updates.get("altLevel")).doubleValue() : null);
            if (updates.containsKey("bloodGroup")) analysis.setBloodGroup((String) updates.get("bloodGroup"));
            if (updates.containsKey("rhesusFactor")) analysis.setRhesusFactor((String) updates.get("rhesusFactor"));
            if (updates.containsKey("hemoglobin")) analysis.setHemoglobin(updates.get("hemoglobin") != null ? ((Number) updates.get("hemoglobin")).doubleValue() : null);
            if (updates.containsKey("technicianNotes")) analysis.setTechnicianNotes((String) updates.get("technicianNotes"));

            // Обновляем статус в зависимости от полноты заполнения
            String donationStatus = null;
            if (analysis.isComplete()) {
                analysis.setStatus("COMPLETED");
                if (analysis.isDonorEligible()) {
                    donationStatus = "QUALIFIED";
                    analysis.getDonation().setStatus("QUALIFIED");
                } else {
                    donationStatus = "REJECTED";
                    analysis.getDonation().setStatus("REJECTED");
                }
                donationRepository.save(analysis.getDonation());
            } else {
                analysis.setStatus("IN_PROGRESS");
            }

            Analysis savedAnalysis = analysisRepository.save(analysis);

            // Возвращаем полную информацию
            Map<String, Object> response = new HashMap<>();
            response.put("analysisId", savedAnalysis.getAnalysisId());
            response.put("status", savedAnalysis.getStatus());
            response.put("isComplete", savedAnalysis.isComplete());
            response.put("isDonorEligible", savedAnalysis.isComplete() ? savedAnalysis.isDonorEligible() : false);
            response.put("donationStatus", donationStatus); // Добавляем статус донации

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update analysis: " + e.getMessage()));
        }
    }

    // Получение всех анализов для blood center
    @GetMapping("/bloodcenter/{bloodCenterId}")
    public ResponseEntity<?> getAnalysesByBloodCenter(@PathVariable Long bloodCenterId) {
        try {
            List<Analysis> analyses = analysisRepository.findByBloodCenter_BloodCenterId(bloodCenterId);
            return ResponseEntity.ok(analyses);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch analyses: " + e.getMessage()));
        }
    }
}