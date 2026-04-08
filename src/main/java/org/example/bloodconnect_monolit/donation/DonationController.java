package org.example.bloodconnect_monolit.donation;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.bloodconnect_monolit.appointment.AppointmentService;
import java.util.Map;

@RestController
@RequestMapping("/donations")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class DonationController {
    private final DonationRepository donationRepository;
    private final AppointmentService appointmentService;

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

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<?> getDonorDonations(@PathVariable Long donorId) {
        try {
            return ResponseEntity.ok(donationRepository.findByDonor_DonorId(donorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}