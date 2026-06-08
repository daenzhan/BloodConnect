package org.example.bloodconnect_monolit.appointment;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.analysis.Analysis;
import org.example.bloodconnect_monolit.analysis.AnalysisRepository;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final DonationRepository donationRepository;
    private final AnalysisRepository analysisRepository;

    @Transactional
    public Appointment createAppointment(Appointment appointment) {
        if (appointment.getAppointmentDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot book appointment in the past");
        }

        int hour = appointment.getAppointmentDate().getHour();
        if (hour < 9 || hour > 17) {
            throw new IllegalArgumentException("Appointments only available between 9:00 AM and 5:00 PM");
        }

        Donor donor = appointment.getDonor();
        if (donor.getLastDonationDate() != null) {
            LocalDate lastDonation = donor.getLastDonationDate();
            LocalDate appointmentDate = appointment.getAppointmentDate().toLocalDate();
            LocalDate minAllowedDate = lastDonation.plusDays(60);

            if (appointmentDate.isBefore(minAllowedDate)) {
                long daysToWait = ChronoUnit.DAYS.between(lastDonation, minAllowedDate);
                throw new IllegalArgumentException(
                        String.format("You must wait %d more days. Last donation was on %s",
                                daysToWait, lastDonation)
                );
            }
        }

        boolean hasConflict = appointmentRepository.existsByDonor_DonorIdAndAppointmentDateBetween(
                appointment.getDonor().getDonorId(),
                appointment.getAppointmentDate().minusHours(2),
                appointment.getAppointmentDate().plusHours(2)
        );

        if (hasConflict) {
            throw new IllegalStateException("You already have an appointment within 2 hours of this time");
        }

        return appointmentRepository.save(appointment);
    }

    // Завершение донации
    @Transactional
    public Appointment completeDonation(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!"IN_PROGRESS".equals(appointment.getStatus())) {
            throw new IllegalStateException("Cannot complete donation for appointment with status: " + appointment.getStatus());
        }

        if (appointment.getDonation() == null) {
            throw new IllegalStateException("No donation found for this appointment");
        }

        // Обновляем статус записи
        appointment.setStatus("COMPLETED");

        // Обновляем статус донации
        Donation donation = appointment.getDonation();
        donation.setStatus("COMPLETED"); // Донация завершена, но анализ ещё может быть в процессе
        donationRepository.save(donation);

        // Обновляем информацию о доноре (но не lastDonationDate до подтверждения анализов!)
        Donor donor = appointment.getDonor();
        // Не обновляем lastDonationDate и donationCount до подтверждения анализов!
        // Они обновятся, когда анализ будет COMPLETED и донор ELIGIBLE

        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus("CANCELLED");
        Appointment savedAppointment = appointmentRepository.save(appointment);

        if (savedAppointment.getDonation() != null) {
            Donation donation = savedAppointment.getDonation();
            donation.setStatus("CANCELLED");
            donationRepository.save(donation);

            // Если есть анализ, тоже отменяем
            analysisRepository.findByDonation_DonationId(donation.getDonationId())
                    .ifPresent(analysis -> {
                        analysis.setStatus("CANCELLED");
                        analysisRepository.save(analysis);
                    });
        }

        return savedAppointment;
    }

    public List<Appointment> getDonorAppointments(Long donorId) {
        return appointmentRepository.findByDonor_DonorId(donorId);
    }

    public List<Appointment> getUpcomingAppointments(Long donorId) {
        return appointmentRepository.findUpcomingAppointments(donorId, LocalDateTime.now());
    }

    @Transactional
    public Appointment startAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));

        System.out.println("=== START APPOINTMENT DEBUG ===");
        System.out.println("Appointment ID: " + appointmentId);
        System.out.println("Current status: " + appointment.getStatus());
        System.out.println("Donor ID: " + (appointment.getDonor() != null ? appointment.getDonor().getDonorId() : "null"));
        System.out.println("Blood Center ID: " + (appointment.getBloodCenter() != null ? appointment.getBloodCenter().getBloodCenterId() : "null"));

        if (!"SCHEDULED".equals(appointment.getStatus())) {
            throw new IllegalStateException("Cannot start appointment with status: " + appointment.getStatus() +
                    ". Expected status: SCHEDULED");
        }

        // Проверяем, что донор существует
        if (appointment.getDonor() == null) {
            throw new IllegalStateException("Appointment has no donor assigned");
        }

        // Проверяем, что центр крови существует
        if (appointment.getBloodCenter() == null) {
            throw new IllegalStateException("Appointment has no blood center assigned");
        }

        // Проверяем, не создана ли уже донация
        if (appointment.getDonation() != null) {
            throw new IllegalStateException("Donation already exists for this appointment");
        }

        // Создаем донацию
        Donation donation = new Donation();
        donation.setDonor(appointment.getDonor());
        donation.setBloodCenter(appointment.getBloodCenter());
        donation.setAppointment(appointment);
        donation.setDonationDate(LocalDateTime.now());
        donation.setStatus("IN_PROGRESS");
        donation.setHasAnalysis(true);

        Donation savedDonation = donationRepository.save(donation);
        System.out.println("Donation created with ID: " + savedDonation.getDonationId());

        appointment.setDonation(savedDonation);
        appointment.setStatus("IN_PROGRESS");

        Appointment savedAppointment = appointmentRepository.save(appointment);
        System.out.println("Appointment status updated to: IN_PROGRESS");

        // СОЗДАЕМ АНАЛИЗ для этой донации
        Analysis analysis = new Analysis();
        analysis.setDonation(savedDonation);
        analysis.setBloodCenter(appointment.getBloodCenter());
        analysis.setStatus("PENDING");
        analysis.setAnalysisDate(LocalDateTime.now());
        analysisRepository.save(analysis);
        System.out.println("Analysis created for donation: " + savedDonation.getDonationId());

        return savedAppointment;
    }
}