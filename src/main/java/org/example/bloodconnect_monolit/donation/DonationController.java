package org.example.bloodconnect_monolit.donation;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.donor.DonorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.bloodconnect_monolit.appointment.AppointmentService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/donations")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
public class DonationController {
    private final DonationRepository donationRepository;
    private final AppointmentService appointmentService;
    private final DonorRepository donorRepository;

    @PutMapping("/{donationId}/complete")
    public ResponseEntity<?> completeDonation(@PathVariable Long donationId) {
        try {
            Donation donation = donationRepository.findById(donationId)
                    .orElseThrow(() -> new RuntimeException("Donation not found"));

            donation.setStatus("COMPLETED");
            donation.setHasAnalysis(false);
            donationRepository.save(donation);

            // Если есть связанная запись, обновляем ее статус
            if (donation.getAppointment() != null) {
                appointmentService.completeAppointment(donation.getAppointment().getAppointmentId());
            }

            return ResponseEntity.ok(donation);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/donor/{userId}")
    public ResponseEntity<?> getDonorDonationsByUserId(@PathVariable Long userId) {
        try {
            // Сначала находим донора по userId
            var donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Donor not found for user ID: " + userId));

            // Получаем донации по donorId
            List<Donation> donations = donationRepository.findByDonor_DonorId(donor.getDonorId());
            return ResponseEntity.ok(donations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}