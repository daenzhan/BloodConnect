package org.example.bloodconnect_monolit.appointment;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.donor.Donor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.example.bloodconnect_monolit.donation.Donation;
import org.example.bloodconnect_monolit.donation.DonationRepository;
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
        // Проверка на дату в прошлом
        if (appointment.getAppointmentDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot book appointment in the past");
        }

        // Проверка рабочего времени
        int hour = appointment.getAppointmentDate().getHour();
        if (hour < 9 || hour > 17) {
            throw new IllegalArgumentException("Appointments only available between 9:00 AM and 5:00 PM");
        }

        // ПРОВЕРКА: 60 дней между последней донацией и ДАТОЙ ЗАПИСИ
        Donor donor = appointment.getDonor();
        if (donor.getLastDonationDate() != null) {
            LocalDate lastDonation = donor.getLastDonationDate();
            LocalDate appointmentDate = appointment.getAppointmentDate().toLocalDate();
            LocalDate minAllowedDate = lastDonation.plusDays(60);

            if (appointmentDate.isBefore(minAllowedDate)) {
                long daysToWait = ChronoUnit.DAYS.between(lastDonation, minAllowedDate);
                throw new IllegalArgumentException(
                        String.format("You must wait %d more days. Last donation was on %s. Earliest allowed date is %s",
                                daysToWait, lastDonation, minAllowedDate)
                );
            }
        }

        // Проверка на конфликт
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

    @Transactional
    public Appointment completeAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus("COMPLETED");

        // Здесь уже НЕ создаем Donation автоматически
        // Donation будет создана отдельно, когда донор фактически сдаст кровь

        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus("CANCELLED");

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getDonorAppointments(Long donorId) {
        return appointmentRepository.findByDonor_DonorId(donorId);
    }

    public List<Appointment> getUpcomingAppointments(Long donorId) {
        return appointmentRepository.findUpcomingAppointments(donorId, LocalDateTime.now());
    }
}