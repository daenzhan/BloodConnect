package org.example.bloodconnect_monolit.bloodCenter;

import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.bloodconnect_monolit.bloodReserve.BloodReserve;
import org.example.bloodconnect_monolit.bloodReserve.BloodReserveRepository;
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

    // Получение всех резервов крови для центра
    @GetMapping("/{bloodCenterId}/reserves")
    public ResponseEntity<?> getReserves(@PathVariable Long bloodCenterId) {
        try {
            List<BloodReserve> reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            List<Map<String, Object>> activeReserves = new ArrayList<>();
            int totalUnits = 0;
            int availableUnits = 0;
            int quarantinedUnits = 0;

            Map<String, Integer> bloodGroupStats = new HashMap<>();
            Map<String, Integer> componentStats = new HashMap<>();

            for (BloodReserve reserve : reserves) {
                Map<String, Object> reserveMap = new HashMap<>();
                reserveMap.put("reserveId", reserve.getReserveId());
                reserveMap.put("componentType", reserve.getComponentType());
                reserveMap.put("bloodGroup", reserve.getBloodGroup());
                reserveMap.put("rhesusFactor", reserve.getRhesusFactor());
                reserveMap.put("inQuarantine", reserve.getInQuarantine());
                reserveMap.put("quarantineEndDate", reserve.getQuarantineEndDate());
                reserveMap.put("isAvailable", reserve.getIsAvailable());
                reserveMap.put("expirationDate", reserve.getExpirationDate());
                reserveMap.put("createdDate", reserve.getCreatedDate());
                reserveMap.put("donationId", reserve.getDonationId());

                if (reserve.getInQuarantine() && reserve.getQuarantineEndDate() != null) {
                    long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                            LocalDateTime.now(), reserve.getQuarantineEndDate()
                    );
                    reserveMap.put("quarantineDaysRemaining", Math.max(0, daysRemaining));
                } else {
                    reserveMap.put("quarantineDaysRemaining", 0);
                }

                long daysUntilExpiration = java.time.temporal.ChronoUnit.DAYS.between(
                        LocalDateTime.now(), reserve.getExpirationDate()
                );
                reserveMap.put("daysUntilExpiration", Math.max(0, daysUntilExpiration));
                reserveMap.put("isExpired", daysUntilExpiration <= 0);

                activeReserves.add(reserveMap);
                totalUnits++;

                if (reserve.isReadyForDistribution()) {
                    availableUnits++;
                }
                if (reserve.getInQuarantine()) {
                    quarantinedUnits++;
                }

                String bloodKey = reserve.getBloodGroup() + (reserve.getRhesusFactor().equals("POSITIVE") ? "+" : "-");
                bloodGroupStats.put(bloodKey, bloodGroupStats.getOrDefault(bloodKey, 0) + 1);

                componentStats.put(reserve.getComponentType(), componentStats.getOrDefault(reserve.getComponentType(), 0) + 1);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("reserves", activeReserves);
            response.put("totalUnits", totalUnits);
            response.put("availableUnits", availableUnits);
            response.put("quarantinedUnits", quarantinedUnits);
            response.put("expiredUnits", totalUnits - availableUnits - quarantinedUnits);
            response.put("bloodGroupStats", bloodGroupStats);
            response.put("componentStats", componentStats);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Получение инвентаря
    @GetMapping("/{bloodCenterId}/inventory")
    public ResponseEntity<?> getInventory(@PathVariable Long bloodCenterId) {
        try {
            List<BloodReserve> reserves = bloodReserveRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            List<Map<String, Object>> inventory = new ArrayList<>();

            for (BloodReserve reserve : reserves) {
                Map<String, Object> item = new HashMap<>();
                item.put("reserveId", reserve.getReserveId());
                item.put("componentType", reserve.getComponentType());
                item.put("bloodGroup", reserve.getBloodGroup());
                item.put("rhesusFactor", reserve.getRhesusFactor());
                item.put("bloodType", reserve.getBloodGroup() + (reserve.getRhesusFactor().equals("POSITIVE") ? "+" : "-"));
                item.put("inQuarantine", reserve.getInQuarantine());
                item.put("isAvailable", reserve.getIsAvailable());
                item.put("expirationDate", reserve.getExpirationDate());
                item.put("quarantineEndDate", reserve.getQuarantineEndDate());
                item.put("donationId", reserve.getDonationId());

                long daysUntilExpiration = java.time.temporal.ChronoUnit.DAYS.between(
                        LocalDateTime.now(), reserve.getExpirationDate()
                );
                item.put("daysUntilExpiration", Math.max(0, daysUntilExpiration));

                String componentDisplay = "";
                switch (reserve.getComponentType()) {
                    case "WHOLE_BLOOD": componentDisplay = "Whole Blood"; break;
                    case "RED_BLOOD_CELLS": componentDisplay = "Red Blood Cells"; break;
                    case "PLATELETS": componentDisplay = "Platelets"; break;
                    case "PLASMA": componentDisplay = "Plasma"; break;
                    case "CRYOPRECIPITATE": componentDisplay = "Cryoprecipitate"; break;
                    default: componentDisplay = reserve.getComponentType();
                }
                item.put("componentDisplayName", componentDisplay);

                inventory.add(item);
            }

            return ResponseEntity.ok(inventory);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Получение статистики донаций
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
            Map<String, Long> bloodTypeCount = new HashMap<>();
            for (Donation donation : donations) {
                if (donation.getAnalysis() != null && donation.getAnalysis().getBloodGroup() != null) {
                    String bloodType = donation.getAnalysis().getBloodGroup() +
                            (donation.getAnalysis().getRhesusFactor().equals("POSITIVE") ? "+" : "-");
                    bloodTypeCount.put(bloodType, bloodTypeCount.getOrDefault(bloodType, 0L) + 1);
                }
            }

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

            long count = 0;
            for (Donation donation : donations) {
                if (donation.getDonationDate() != null &&
                        donation.getDonationDate().isAfter(start) &&
                        donation.getDonationDate().isBefore(end)) {
                    count++;
                }
            }

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

    @PutMapping("/{bloodCenterId}/license")
    public ResponseEntity<?> updateLicense(@PathVariable Long bloodCenterId, @RequestBody Map<String, String> request) {
        try {
            String licenseFile = request.get("licenseFile");
            Optional<BloodCenter> centerOpt = bloodCenterRepository.findById(bloodCenterId);
            if (centerOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            BloodCenter center = centerOpt.get();
            center.setLicenseFile(licenseFile);
            bloodCenterRepository.save(center);
            return ResponseEntity.ok(Map.of("message", "License updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}