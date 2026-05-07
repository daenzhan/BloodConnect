package org.example.bloodconnect_monolit.donor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/donor")
@CrossOrigin(origins = "http://localhost:3000")
public class DonorController {

    @Autowired
    private DonorRepository donorRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getDonorByUserId(@PathVariable Long userId) {
        Optional<Donor> donor = donorRepository.findByUser_UserId(userId);
        if (donor.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(donor.get());
    }

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<Map<String, Object>> getDashboardData(@PathVariable Long userId) {
        Optional<Donor> donorOptional = donorRepository.findByUser_UserId(userId);

        if (donorOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Donor donor = donorOptional.get();
        Map<String, Object> dashboardData = new HashMap<>();

        // ДОБАВЛЯЕМ userId В ОТВЕТ
        dashboardData.put("donorId", donor.getDonorId());
        dashboardData.put("userId", userId);  // ← ВАЖНО: добавляем userId

        // Basic donor information
        dashboardData.put("fullName", donor.getFullName());

        // Blood type format (e.g., "A+", "B-", "O+", "AB-")
        String bloodType = donor.getBloodGroup() +
                (donor.getRhesusFactor() != null &&
                        donor.getRhesusFactor().toLowerCase().contains("positive") ? "+" : "-");
        dashboardData.put("bloodType", bloodType);
        dashboardData.put("rhesusFactor", donor.getRhesusFactor());

        // Profile data
        dashboardData.put("birthDate", donor.getBirthDate() != null ? donor.getBirthDate().toString() : null);
        dashboardData.put("iin", donor.getIin());
        dashboardData.put("address", donor.getAddress());
        dashboardData.put("city", donor.getCity());
        dashboardData.put("gender", donor.getGender());
        dashboardData.put("weight", donor.getWeight());
        dashboardData.put("height", donor.getHeight());

        // Donation statistics
        Integer donationCount = donor.getDonationCount() != null ? donor.getDonationCount() : 0;
        dashboardData.put("totalDonations", donationCount);

        // Lives saved (1 donation = 3 lives saved)
        dashboardData.put("livesSaved", donationCount * 3);

        // Donor level based on donation count (English levels)
        String donorLevel = calculateDonorLevel(donationCount);
        dashboardData.put("donorLevel", donorLevel);

        // Rating and points
        dashboardData.put("rating", donor.getRating() != null ? donor.getRating() : 0);
        dashboardData.put("points", donor.getPoints() != null ? donor.getPoints() : 0);

        // Donor status
        dashboardData.put("donorStatus", donor.getDonorStatus() != null ? donor.getDonorStatus() : "ACTIVE");

        // Last donation information
        LocalDate lastDonation = donor.getLastDonationDate();
        if (lastDonation != null) {
            dashboardData.put("lastDonationDate", lastDonation.toString());

            // Calculate days until next eligible donation (usually 60 days for blood)
            LocalDate nextEligibleDate = lastDonation.plusDays(60);
            long daysUntilNext = ChronoUnit.DAYS.between(LocalDate.now(), nextEligibleDate);
            dashboardData.put("daysUntilNextDonation", Math.max(0, daysUntilNext));
            dashboardData.put("nextEligibleDate", nextEligibleDate.toString());
        } else {
            // If no donations yet
            dashboardData.put("lastDonationDate", null);
            dashboardData.put("daysUntilNextDonation", 0);
            dashboardData.put("nextEligibleDate", LocalDate.now().toString());
        }

        // Appointments (to be added later)
        dashboardData.put("appointments", List.of());

        return ResponseEntity.ok(dashboardData);
    }

    private String calculateDonorLevel(Integer donationCount) {
        if (donationCount == null || donationCount == 0) return "Newcomer";
        if (donationCount < 5) return "Bronze";
        if (donationCount < 15) return "Silver";
        if (donationCount < 25) return "Gold";
        return "Platinum";
    }


    @GetMapping("/top-donors")
    public ResponseEntity<List<Map<String, Object>>> getTopDonors() {
        List<Donor> allDonors = donorRepository.findAll();

        // Сортируем доноров по количеству донаций (от большего к меньшему)
        List<Donor> sortedDonors = allDonors.stream()
                .filter(d -> d.getDonationCount() != null && d.getDonationCount() > 0)
                .sorted((a, b) -> b.getDonationCount().compareTo(a.getDonationCount()))
                .limit(50) // Топ 50 доноров
                .toList();

        List<Map<String, Object>> topDonors = new java.util.ArrayList<>();
        int rank = 1;

        for (Donor donor : sortedDonors) {
            Map<String, Object> donorData = new HashMap<>();
            donorData.put("rank", rank++);
            donorData.put("donorId", donor.getDonorId());
            donorData.put("fullName", donor.getFullName());
            donorData.put("donationCount", donor.getDonationCount());
            donorData.put("bloodType", donor.getFormattedBloodType());
            donorData.put("city", donor.getCity());
            donorData.put("rating", donor.getRating() != null ? donor.getRating() : 0);
            donorData.put("points", donor.getPoints() != null ? donor.getPoints() : 0);
            donorData.put("donorLevel", calculateDonorLevel(donor.getDonationCount()));
            donorData.put("lastDonationDate", donor.getLastDonationDate() != null ? donor.getLastDonationDate().toString() : null);

            topDonors.add(donorData);
        }

        return ResponseEntity.ok(topDonors);
    }

    @GetMapping("/current-donor-rank/{userId}")
    public ResponseEntity<Map<String, Object>> getCurrentDonorRank(@PathVariable Long userId) {
        Optional<Donor> donorOpt = donorRepository.findByUser_UserId(userId);

        if (donorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Donor currentDonor = donorOpt.get();
        List<Donor> allDonors = donorRepository.findAll();

        // Сортируем и находим ранг текущего донора
        List<Donor> sortedDonors = allDonors.stream()
                .filter(d -> d.getDonationCount() != null && d.getDonationCount() > 0)
                .sorted((a, b) -> b.getDonationCount().compareTo(a.getDonationCount()))
                .toList();

        int rank = 1;
        for (Donor donor : sortedDonors) {
            if (donor.getDonorId().equals(currentDonor.getDonorId())) {
                break;
            }
            rank++;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("rank", rank);
        response.put("totalDonors", sortedDonors.size());
        response.put("donationCount", currentDonor.getDonationCount());
        response.put("donorLevel", calculateDonorLevel(currentDonor.getDonationCount()));
        response.put("nextRankDonations", getNextRankDonations(currentDonor.getDonationCount()));

        return ResponseEntity.ok(response);
    }

    private int getNextRankDonations(Integer currentCount) {
        if (currentCount == null || currentCount < 5) return 5 - currentCount;
        if (currentCount < 15) return 15 - currentCount;
        if (currentCount < 25) return 25 - currentCount;
        return 0;
    }

}