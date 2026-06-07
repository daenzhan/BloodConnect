package org.example.bloodconnect_monolit.donation;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.appointment.Appointment;
import org.example.bloodconnect_monolit.appointment.AppointmentRepository;
import org.example.bloodconnect_monolit.donor.DonorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/donations")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class DonationController {

    private final DonationRepository donationRepository;
    private final AppointmentRepository appointmentRepository;
    private final DonorRepository donorRepository;

    @GetMapping("/bloodcenter/{bloodCenterId}")
    public ResponseEntity<List<Donation>> getDonationsByBloodCenter(@PathVariable Long bloodCenterId) {
        List<Donation> donations = donationRepository.findByBloodCenter_BloodCenterId(bloodCenterId);
        return ResponseEntity.ok(donations);
    }

    @PostMapping("/create-from-appointment/{appointmentId}")
    public ResponseEntity<?> createDonationFromAppointment(@PathVariable Long appointmentId) {
        try {
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "appointment not found"));
            }

            Appointment appointment = appointmentOpt.get();

            if (appointment.getDonation() != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "donation already exists for this appointment"));
            }

            Donation donation = new Donation();
            donation.setDonor(appointment.getDonor());
            donation.setBloodCenter(appointment.getBloodCenter());
            donation.setAppointment(appointment);
            donation.setDonationDate(LocalDateTime.now());
            donation.setStatus("COMPLETED");
            donation.setHasAnalysis(false);

            Donation savedDonation = donationRepository.save(donation);

            appointment.setDonation(savedDonation);
            appointment.setStatus("COMPLETED");
            appointmentRepository.save(appointment);

            var donor = appointment.getDonor();
            donor.setLastDonationDate(LocalDateTime.now().toLocalDate());
            donor.setDonationCount((donor.getDonationCount() != null ? donor.getDonationCount() : 0) + 1);
            donorRepository.save(donor);

            return ResponseEntity.ok(Map.of(
                    "message", "donation completed successfully",
                    "donationId", savedDonation.getDonationId(),
                    "status", savedDonation.getStatus()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // обновление статуса донации вместе с записью
    @PutMapping("/{donationId}/status-with-appointment")
    public ResponseEntity<?> updateDonationAndAppointmentStatus(
            @PathVariable Long donationId,
            @RequestBody Map<String, String> request) {
        try {
            String donationStatus = request.get("donationStatus");
            String appointmentStatus = request.get("appointmentStatus");

            Optional<Donation> donationOpt = donationRepository.findById(donationId);
            if (donationOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Donation not found"));
            }

            Donation donation = donationOpt.get();
            donation.setStatus(donationStatus);
            donationRepository.save(donation);

            Appointment appointment = donation.getAppointment();
            if (appointment != null && appointmentStatus != null) {
                appointment.setStatus(appointmentStatus);
                appointmentRepository.save(appointment);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "statuses updated successfully",
                    "donationStatus", donation.getStatus(),
                    "appointmentStatus", appointment != null ? appointment.getStatus() : null
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/donor/{userId}")
    public ResponseEntity<?> getDonorDonationsByUserId(@PathVariable Long userId) {
        try {
            var donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("donor not found for user ID: " + userId));

            List<Donation> donations = donationRepository.findByDonor_DonorId(donor.getDonorId());
            return ResponseEntity.ok(donations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bloodcenter/{bloodCenterId}/date")
    public ResponseEntity<?> getDonationsByDate(@PathVariable Long bloodCenterId, @RequestParam String date) {
        try {
            LocalDateTime startOfDay = LocalDate.parse(date).atStartOfDay(); // atStartOfDay() - LocalDate с полночи
            LocalDateTime endOfDay = startOfDay.plusDays(1);

            List<Donation> donations = donationRepository.findByBloodCenter_BloodCenterIdAndDonationDateBetween(
                    bloodCenterId, startOfDay, endOfDay
            );
            return ResponseEntity.ok(donations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getDonationByAppointmentId(@PathVariable Long appointmentId) {
        try {
            Optional<Donation> donationOpt = donationRepository.findByAppointment_AppointmentId(appointmentId);

            if (donationOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                        "exists", false,
                        "message", "donation not found for this appointment"
                ));
            }

            Donation donation = donationOpt.get();
            return ResponseEntity.ok(Map.of(
                    "donationId", donation.getDonationId(),
                    "status", donation.getStatus(),
                    "donationDate", donation.getDonationDate(),
                    "hasAnalysis", donation.getHasAnalysis(),
                    "appointmentId", donation.getAppointment().getAppointmentId()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}