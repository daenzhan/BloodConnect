package org.example.bloodconnect_monolit.bloodCenter;

import org.example.bloodconnect_monolit.bloodReserve.BloodReserve;
import org.example.bloodconnect_monolit.bloodReserve.BloodReserveRepository;
import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/blood-centers")
@CrossOrigin(origins = "http://localhost:3000")
public class BloodCenterController {

    @Autowired
    private BloodCenterRepository bloodCenterRepository;

    @Autowired
    private BloodReserveRepository bloodReserveRepository;

    @Autowired
    private DonationRepository donationRepository;

    // Все возможные типы крови
    private final List<Map<String, String>> ALL_BLOOD_TYPES = Arrays.asList(
            Map.of("group", "A", "rh", "+"),
            Map.of("group", "A", "rh", "-"),
            Map.of("group", "B", "rh", "+"),
            Map.of("group", "B", "rh", "-"),
            Map.of("group", "AB", "rh", "+"),
            Map.of("group", "AB", "rh", "-"),
            Map.of("group", "O", "rh", "+"),
            Map.of("group", "O", "rh", "-")
    );

    @GetMapping
    public ResponseEntity<List<BloodCenter>> getAllBloodCenters() {
        return ResponseEntity.ok(bloodCenterRepository.findAll());
    }

    @GetMapping("/{bloodCenterId}")
    public ResponseEntity<BloodCenter> getBloodCenterById(@PathVariable Long bloodCenterId) {
        return bloodCenterRepository.findById(bloodCenterId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<BloodCenter> getBloodCenterByUserId(@PathVariable Long userId) {
        return bloodCenterRepository.findByUser_UserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{bloodCenterId}/reserves")
    public ResponseEntity<List<BloodReserve>> getReserves(@PathVariable Long bloodCenterId) {
        List<BloodReserve> reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

        // Если резервов нет - создаем все типы с 0
        if (reserves.isEmpty()) {
            initializeReserves(bloodCenterId);
            reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);
        }

        return ResponseEntity.ok(reserves);
    }

    @PutMapping("/{bloodCenterId}/reserves")
    public ResponseEntity<?> updateReserve(@PathVariable Long bloodCenterId,
                                           @RequestBody BloodReserve updatedReserve) {
        Optional<BloodReserve> existingOpt = bloodReserveRepository
                .findByBloodCenter_BloodCenterIdAndBloodGroupAndRhesusFactor(
                        bloodCenterId,
                        updatedReserve.getBloodGroup(),
                        updatedReserve.getRhesusFactor()
                );

        if (existingOpt.isPresent()) {
            BloodReserve existing = existingOpt.get();
            existing.setQuantity(updatedReserve.getQuantity());
            bloodReserveRepository.save(existing);
        } else {
            Optional<BloodCenter> centerOpt = bloodCenterRepository.findById(bloodCenterId);
            if (centerOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Blood center not found");
            }
            updatedReserve.setBloodCenter(centerOpt.get());
            bloodReserveRepository.save(updatedReserve);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{bloodCenterId}/reserves/add")
    public ResponseEntity<?> addToReserve(@PathVariable Long bloodCenterId,
                                          @RequestBody Map<String, Object> request) {
        String bloodGroup = (String) request.get("bloodGroup");
        String rhesusFactor = (String) request.get("rhesusFactor");
        Integer quantity = (Integer) request.get("quantity");

        // Сначала убеждаемся, что все типы крови существуют
        initializeReserves(bloodCenterId);

        Optional<BloodReserve> existingOpt = bloodReserveRepository
                .findByBloodCenter_BloodCenterIdAndBloodGroupAndRhesusFactor(
                        bloodCenterId, bloodGroup, rhesusFactor);

        if (existingOpt.isPresent()) {
            BloodReserve existing = existingOpt.get();
            existing.setQuantity(existing.getQuantity() + quantity);
            bloodReserveRepository.save(existing);
        } else {
            // Если вдруг не существует - создаем
            BloodCenter center = bloodCenterRepository.findById(bloodCenterId)
                    .orElseThrow(() -> new RuntimeException("Blood center not found"));
            BloodReserve newReserve = new BloodReserve();
            newReserve.setBloodCenter(center);
            newReserve.setBloodGroup(bloodGroup);
            newReserve.setRhesusFactor(rhesusFactor);
            newReserve.setQuantity(quantity);
            bloodReserveRepository.save(newReserve);
        }
        return ResponseEntity.ok().build();
    }

    // Метод для инициализации всех типов крови с 0 единицами
    private void initializeReserves(Long bloodCenterId) {
        BloodCenter center = bloodCenterRepository.findById(bloodCenterId)
                .orElseThrow(() -> new RuntimeException("Blood center not found"));

        for (Map<String, String> bloodType : ALL_BLOOD_TYPES) {
            String group = bloodType.get("group");
            String rh = bloodType.get("rh");

            Optional<BloodReserve> existing = bloodReserveRepository
                    .findByBloodCenter_BloodCenterIdAndBloodGroupAndRhesusFactor(bloodCenterId, group, rh);

            if (existing.isEmpty()) {
                BloodReserve newReserve = new BloodReserve();
                newReserve.setBloodCenter(center);
                newReserve.setBloodGroup(group);
                newReserve.setRhesusFactor(rh);
                newReserve.setQuantity(0);
                bloodReserveRepository.save(newReserve);
            }
        }
    }

    @GetMapping("/{bloodCenterId}/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(@PathVariable Long bloodCenterId,
                                                             @RequestParam(defaultValue = "month") String period) {
        List<Donation> donations = donationRepository.findByBloodCenter_BloodCenterId(bloodCenterId);
        long totalDonations = donations.size();
        long totalDonors = donations.stream().map(d -> d.getDonor().getDonorId()).distinct().count();
        long livesSaved = totalDonations * 3;
        double avgPerDay = totalDonations / 30.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDonations", totalDonations);
        stats.put("totalDonors", totalDonors);
        stats.put("livesSaved", livesSaved);
        stats.put("avgDonationsPerDay", Math.round(avgPerDay * 10) / 10.0);

        List<Map<String, Object>> bloodTypeDistribution = new ArrayList<>();

        if (totalDonations > 0) {
            Map<String, Long> bloodTypeCount = donations.stream()
                    .filter(d -> d.getAnalysis() != null && d.getAnalysis().getBloodGroup() != null)
                    .collect(Collectors.groupingBy(
                            d -> d.getAnalysis().getBloodGroup() + d.getAnalysis().getRhesusFactor(),
                            Collectors.counting()
                    ));

            for (Map.Entry<String, Long> entry : bloodTypeCount.entrySet()) {
                Map<String, Object> typeMap = new HashMap<>();
                typeMap.put("bloodType", entry.getKey());
                typeMap.put("count", entry.getValue());
                typeMap.put("percentage", Math.round(entry.getValue() * 100.0 / totalDonations));
                bloodTypeDistribution.add(typeMap);
            }
        }

        List<Map<String, Object>> monthlyData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM");

        for (int i = 5; i >= 0; i--) {
            LocalDateTime start = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusMonths(1);

            long count = donations.stream()
                    .filter(d -> d.getDonationDate() != null &&
                            d.getDonationDate().isAfter(start) &&
                            d.getDonationDate().isBefore(end))
                    .count();

            Map<String, Object> monthMap = new HashMap<>();
            monthMap.put("month", start.format(formatter));
            monthMap.put("donations", count);
            monthMap.put("newDonors", 0);
            monthlyData.add(monthMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats);
        response.put("bloodTypeDistribution", bloodTypeDistribution);
        response.put("monthlyData", monthlyData);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{bloodCenterId}/reserves/initialize")
    public ResponseEntity<?> initializeReserves_(@PathVariable Long bloodCenterId) {
        try {
            BloodCenter center = bloodCenterRepository.findById(bloodCenterId)
                    .orElseThrow(() -> new RuntimeException("Blood center not found"));

            String[][] bloodTypes = {{"A", "+"}, {"A", "-"}, {"B", "+"}, {"B", "-"},
                    {"AB", "+"}, {"AB", "-"}, {"O", "+"}, {"O", "-"}};

            for (String[] type : bloodTypes) {
                String group = type[0];
                String rh = type[1];

                Optional<BloodReserve> existing = bloodReserveRepository
                        .findByBloodCenter_BloodCenterIdAndBloodGroupAndRhesusFactor(bloodCenterId, group, rh);

                if (existing.isEmpty()) {
                    BloodReserve reserve = new BloodReserve();
                    reserve.setBloodCenter(center);
                    reserve.setBloodGroup(group);
                    reserve.setRhesusFactor(rh);
                    reserve.setQuantity(0);
                    bloodReserveRepository.save(reserve);
                }
            }
            return ResponseEntity.ok().body(Map.of("message", "All blood types initialized"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}