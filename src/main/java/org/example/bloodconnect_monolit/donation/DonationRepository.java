// org.example.bloodconnect_monolit.donation.DonationRepository
package org.example.bloodconnect_monolit.donation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByDonor_DonorId(Long donorId);
    List<Donation> findByDonor_DonorIdAndStatus(Long donorId, String status);
    List<Donation> findByBloodCenter_BloodCenterId(Long bloodCenterId);
    Optional<Donation> findByAppointment_AppointmentId(Long appointmentId);
    List<Donation> findByBloodCenter_BloodCenterIdAndDonationDateBetween(
            Long bloodCenterId, LocalDateTime start, LocalDateTime end
    );
    @Query("SELECT d FROM Donation d WHERE d.donor.donorId = :donorId ORDER BY d.donationDate ASC")
    List<Donation> findByDonor_DonorIdOrderByDonationDateAsc(@Param("donorId") Long donorId);
    long countByDonationDateBetween(LocalDateTime start, LocalDateTime end);
}