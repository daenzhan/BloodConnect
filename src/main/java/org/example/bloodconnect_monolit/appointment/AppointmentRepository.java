package org.example.bloodconnect_monolit.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDonor_DonorId(Long donorId);

    List<Appointment> findByDonor_DonorIdAndStatus(Long donorId, String status);

    @Query("SELECT a FROM Appointment a WHERE a.donor.donorId = :donorId AND a.appointmentDate >= :date ORDER BY a.appointmentDate ASC")
    List<Appointment> findUpcomingAppointments(@Param("donorId") Long donorId, @Param("date") LocalDateTime date);

    boolean existsByDonor_DonorIdAndAppointmentDateBetween(Long donorId, LocalDateTime start, LocalDateTime end);
}