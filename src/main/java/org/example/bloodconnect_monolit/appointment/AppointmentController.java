package org.example.bloodconnect_monolit.appointment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.donor.DonorRepository;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/appointments")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService appointmentService;
    private final DonorRepository donorRepository;
    private final BloodCenterRepository bloodCenterRepository;
    private final AppointmentRepository appointmentRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("donorId").toString());
            Long bloodCenterId = Long.valueOf(request.get("bloodCenterId").toString());
            String appointmentDateStr = request.get("appointmentDate").toString();
            LocalDateTime appointmentDateTime = LocalDateTime.parse(appointmentDateStr);
            String notes = request.get("notes") != null ? request.get("notes").toString() : null;

            Donor donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Donor not found for user ID: " + userId));

            LocalDate appointmentDate = appointmentDateTime.toLocalDate();
            LocalDate today = LocalDate.now();

            if (appointmentDate.isBefore(today)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot book appointment in the past. Please select a future date."
                ));
            }

            if (donor.getLastDonationDate() != null) {
                LocalDate lastDonation = donor.getLastDonationDate();
                LocalDate minAllowedDate = lastDonation.plusDays(60);

                if (appointmentDate.isBefore(minAllowedDate)) {
                    long daysToWait = ChronoUnit.DAYS.between(lastDonation, minAllowedDate);
                    String errorMessage = String.format(
                            "You cannot book an appointment before %s. " +
                                    "You must wait %d more days. Last donation was on %s.",
                            minAllowedDate, daysToWait, lastDonation.toString()
                    );
                    return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
                }
            }

            if (appointmentDate.isAfter(today.plusMonths(3))) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cannot book more than 3 months in advance"
                ));
            }

            int hour = appointmentDateTime.getHour();
            if (hour < 9 || hour > 17) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Appointments only available between 9:00 AM and 5:00 PM"
                ));
            }

            BloodCenter bloodCenter = bloodCenterRepository.findById(bloodCenterId)
                    .orElseThrow(() -> new RuntimeException("Blood center not found"));

            Appointment appointment = new Appointment();
            appointment.setDonor(donor);
            appointment.setBloodCenter(bloodCenter);
            appointment.setAppointmentDate(appointmentDateTime);
            appointment.setNotes(notes);
            appointment.setStatus("SCHEDULED");

            Appointment saved = appointmentService.createAppointment(appointment);

            return ResponseEntity.ok(Map.of(
                    "message", "Appointment booked successfully",
                    "appointmentId", saved.getAppointmentId(),
                    "appointmentDate", saved.getAppointmentDate()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{appointmentId}/start")
    public ResponseEntity<?> startAppointment(@PathVariable Long appointmentId) {
        try {
            Appointment appointment = appointmentService.startAppointment(appointmentId);
            return ResponseEntity.ok(Map.of(
                    "message", "Appointment started successfully. Donation and Analysis created.",
                    "appointmentId", appointment.getAppointmentId(),
                    "status", appointment.getStatus(),
                    "donationId", appointment.getDonation() != null ? appointment.getDonation().getDonationId() : null
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    @PutMapping("/{appointmentId}/complete-donation")
    public ResponseEntity<?> completeDonation(@PathVariable Long appointmentId) {
        try {
            Appointment appointment = appointmentService.completeDonation(appointmentId);
            return ResponseEntity.ok(Map.of(
                    "message", "Donation completed. Analysis is pending.",
                    "appointmentId", appointment.getAppointmentId(),
                    "status", appointment.getStatus(),
                    "donationId", appointment.getDonation() != null ? appointment.getDonation().getDonationId() : null
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/donor/{userId}")
    public ResponseEntity<?> getDonorAppointments(@PathVariable Long userId) {
        try {
            Donor donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Donor not found for user ID: " + userId));

            List<Appointment> appointments = appointmentService.getDonorAppointments(donor.getDonorId());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/donor/{userId}/upcoming")
    public ResponseEntity<?> getUpcomingAppointments(@PathVariable Long userId) {
        try {
            Donor donor = donorRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Donor not found for user ID: " + userId));

            List<Appointment> appointments = appointmentService.getUpcomingAppointments(donor.getDonorId());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long appointmentId) {
        try {
            Appointment cancelled = appointmentService.cancelAppointment(appointmentId);
            return ResponseEntity.ok(Map.of(
                    "message", "Appointment cancelled successfully",
                    "appointmentId", cancelled.getAppointmentId(),
                    "status", cancelled.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ ИСПРАВЛЕННЫЙ МЕТОД: теперь включает donation объект
    @GetMapping("/bloodcenter/{bloodCenterId}")
    public ResponseEntity<?> getAppointmentsByBloodCenter(@PathVariable Long bloodCenterId) {
        try {
            List<Appointment> appointments = appointmentRepository.findByBloodCenter_BloodCenterId(bloodCenterId);

            // Преобразуем каждый appointment в DTO с donation информацией
            List<Map<String, Object>> appointmentsWithDonation = appointments.stream().map(appointment -> {
                Map<String, Object> appointmentMap = Map.of(
                        "appointmentId", appointment.getAppointmentId(),
                        "appointmentDate", appointment.getAppointmentDate(),
                        "status", appointment.getStatus(),
                        "notes", appointment.getNotes() != null ? appointment.getNotes() : "",
                        "donor", Map.of(
                                "donorId", appointment.getDonor().getDonorId(),
                                "firstName", appointment.getDonor().getFirstName(),
                                "lastName", appointment.getDonor().getLastName(),
                                "bloodGroup", appointment.getDonor().getBloodGroup() != null ? appointment.getDonor().getBloodGroup() : "",
                                "rhesusFactor", appointment.getDonor().getRhesusFactor() != null ? appointment.getDonor().getRhesusFactor() : ""
                        )
                );

                // Создаем изменяемую мапу
                Map<String, Object> result = new java.util.HashMap<>(appointmentMap);

                // Добавляем donation если существует
                if (appointment.getDonation() != null) {
                    result.put("donation", Map.of(
                            "donationId", appointment.getDonation().getDonationId(),
                            "status", appointment.getDonation().getStatus()
                    ));
                } else {
                    result.put("donation", null);
                }

                return result;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(appointmentsWithDonation);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{appointmentId}/update-status")
    public ResponseEntity<?> updateAppointmentStatus(@PathVariable Long appointmentId, @RequestBody Map<String, String> request) {
        try {
            String newStatus = request.get("status");
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Appointment appointment = appointmentOpt.get();
            appointment.setStatus(newStatus);
            appointmentRepository.save(appointment);

            return ResponseEntity.ok(Map.of(
                    "message", "Status updated successfully",
                    "status", newStatus
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}