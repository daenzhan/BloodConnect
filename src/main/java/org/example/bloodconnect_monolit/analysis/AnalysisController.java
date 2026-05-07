package org.example.bloodconnect_monolit.analysis;

import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.donor.DonorRepository;
import org.example.bloodconnect_monolit.recomendationAI.AiRecommendationClient;
import org.example.bloodconnect_monolit.recomendationAI.AiRecommendationRequest;
import org.example.bloodconnect_monolit.recomendationAI.AiRecommendationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
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

    @Autowired
    private AiRecommendationClient aiRecommendationClient;

    @Autowired
    private DonorRepository donorRepository;

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

    // эндпоинт для получения AI-рекомендации
    @GetMapping("/donor/{donorId}/ai-recommendation")
    public ResponseEntity<?> getAiRecommendation(@PathVariable Long donorId) {
        try {
            Optional<Donor> donorOpt = donorRepository.findById(donorId);
            if (donorOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Donor donor = donorOpt.get();

            // Получаем последний анализ донора
            Optional<Analysis> lastAnalysis = analysisRepository.findLatestByDonorId(donorId);

            // Создаем запрос для AI
            AiRecommendationRequest request = new AiRecommendationRequest();
            request.setAge(calculateAge(donor.getBirthDate()));
            request.setGender(donor.getGender().equals("MALE") ? 1 : 0);
            request.setBloodType(donor.getFormattedBloodType());
            request.setHeightCm(donor.getHeight());
            request.setWeightKg(donor.getWeight());

            if (lastAnalysis.isPresent()) {
                Analysis analysis = lastAnalysis.get();
                request.setHemoglobin(analysis.getHemoglobin() != null ? analysis.getHemoglobin() : 0);
                request.setFerritin(null); // если есть поле ферритина
            } else {
                request.setHemoglobin(0);
                request.setFerritin(null);
            }

            request.setPrevDonations(donor.getDonationCount() != null ? donor.getDonationCount() : 0);
            request.setAvgIntervalDays(calculateAvgInterval(donor));
            request.setLowHgbHistory(hasLowHemoglobinHistory(donorId) ? 1 : 0);

            // Получаем рекомендацию от AI
            AiRecommendationResponse aiResponse = aiRecommendationClient.getRecommendation(request);

            // Сохраняем рекомендацию в БД (опционально)
            // saveRecommendation(donorId, aiResponse);

            Map<String, Object> response = new HashMap<>();
            response.put("success", aiResponse.isSuccess());
            response.put("nextDonationDays", aiResponse.getNextDonationDays());
            response.put("readySoon", aiResponse.isReadySoon());
            response.put("readinessLevel", aiResponse.getReadinessLevel());
            response.put("readinessText", aiResponse.getReadinessText());
            response.put("healthAdvice", aiResponse.getHealthAdvice());
            response.put("confidence", aiResponse.getConfidence());
            response.put("bmi", calculateBMI(donor.getWeight(), donor.getHeight()));
            response.put("bmiCategory", aiResponse.getBmiCategory());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private int calculateAge(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private double calculateBMI(Double weight, Double height) {
        if (weight == null || height == null) return 0;
        return weight / Math.pow(height / 100, 2);
    }

    private Integer calculateAvgInterval(Donor donor) {
        try {
            List<Donation> donations = donationRepository.findByDonor_DonorIdOrderByDonationDateAsc(donor.getDonorId());
            if (donations == null || donations.size() < 2) {
                return null;
            }

            long totalDays = 0;
            int intervals = 0;

            for (int i = 1; i < donations.size(); i++) {
                Donation prev = donations.get(i - 1);
                Donation current = donations.get(i);

                if (prev.getDonationDate() != null && current.getDonationDate() != null) {
                    long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(
                            prev.getDonationDate(),
                            current.getDonationDate()
                    );
                    totalDays += daysBetween;
                    intervals++;
                }
            }
            if (intervals == 0) {
                return null;
            }
            return (int) (totalDays / intervals);
        } catch (Exception e) {
            System.err.println("Error calculating average interval: " + e.getMessage());
            return null;
        }
    }

    private boolean hasLowHemoglobinHistory(Long donorId) {
        try {
            Optional<Donor> donorOpt = donorRepository.findById(donorId);
            if (donorOpt.isEmpty()) {
                return false;
            }
            Donor donor = donorOpt.get();

            double threshold = "MALE".equals(donor.getGender()) ? 130.0 : 120.0;

            List<Analysis> analyses = analysisRepository.findAllByDonorIdOrderByDateAsc(donorId);

            if (analyses == null || analyses.isEmpty()) {
                return false;
            }
            for (Analysis analysis : analyses) {
                if (analysis.getHemoglobin() != null && analysis.getHemoglobin() < threshold) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            System.err.println("Error checking low hemoglobin history: " + e.getMessage());
            return false;
        }
    }

    @GetMapping("/donor/{donorId}/latest")
    public ResponseEntity<?> getLatestAnalysisByDonorId(@PathVariable Long donorId) {
        try {
            Optional<Analysis> analysisOpt = analysisRepository.findLatestByDonorId(donorId);
            if (analysisOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(analysisOpt.get());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}