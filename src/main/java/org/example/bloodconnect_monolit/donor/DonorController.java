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

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<Map<String, Object>> getDashboardData(@PathVariable Long userId) {
        Optional<Donor> donorOptional = donorRepository.findByUser_UserId(userId);

        if (donorOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Donor donor = donorOptional.get();
        Map<String, Object> dashboardData = new HashMap<>();

        // ДОБАВЛЯЕМ userId В ОТВЕТ
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
}