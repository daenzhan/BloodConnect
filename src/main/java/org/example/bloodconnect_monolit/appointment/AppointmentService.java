package org.example.bloodconnect_monolit.appointment;

import lombok.RequiredArgsConstructor;
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

    // Старт записи - создаем донацию
    @Transactional
    public Appointment startAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Проверяем, что запись в статусе SCHEDULED
        if (!"SCHEDULED".equals(appointment.getStatus())) {
            throw new IllegalStateException("Cannot start appointment with status: " + appointment.getStatus());
        }

        // Создаем донацию
        Donation donation = new Donation();
        donation.setDonor(appointment.getDonor());
        donation.setBloodCenter(appointment.getBloodCenter());
        donation.setAppointment(appointment);
        donation.setDonationDate(LocalDateTime.now());
        donation.setStatus("IN_PROGRESS"); // Статус донации - IN_PROGRESS
        donation.setHasAnalysis(false);

        Donation savedDonation = donationRepository.save(donation);

        // Связываем донацию с записью
        appointment.setDonation(savedDonation);
        appointment.setStatus("IN_PROGRESS");

        return appointmentRepository.save(appointment);
    }

    // Завершение донации
    @Transactional
    public Appointment completeDonation(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Проверяем, что запись в статусе IN_PROGRESS
        if (!"IN_PROGRESS".equals(appointment.getStatus())) {
            throw new IllegalStateException("Cannot complete donation for appointment with status: " + appointment.getStatus());
        }

        // Проверяем, что донация существует
        if (appointment.getDonation() == null) {
            throw new IllegalStateException("No donation found for this appointment");
        }

        // Обновляем статус записи
        appointment.setStatus("COMPLETED");

        // Обновляем статус донации
        Donation donation = appointment.getDonation();
        donation.setStatus("COMPLETED");
        donationRepository.save(donation);

        // Обновляем информацию о доноре
        Donor donor = appointment.getDonor();
        donor.setLastDonationDate(LocalDateTime.now().toLocalDate());
        donor.setDonationCount((donor.getDonationCount() != null ? donor.getDonationCount() : 0) + 1);

        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus("CANCELLED");
        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Если есть связанная донация, обновляем её статус
        if (savedAppointment.getDonation() != null) {
            Donation donation = savedAppointment.getDonation();
            donation.setStatus("CANCELLED");
            donationRepository.save(donation);
        }

        return savedAppointment;
    }

    public List<Appointment> getDonorAppointments(Long donorId) {
        return appointmentRepository.findByDonor_DonorId(donorId);
    }

    public List<Appointment> getUpcomingAppointments(Long donorId) {
        return appointmentRepository.findUpcomingAppointments(donorId, LocalDateTime.now());
    }
}