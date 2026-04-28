// org.example.bloodconnect_monolit.donation.DonationRepository
package org.example.bloodconnect_monolit.donation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByDonor_DonorId(Long donorId);
    List<Donation> findByDonor_DonorIdAndStatus(Long donorId, String status);
    List<Donation> findByBloodCenter_BloodCenterId(Long bloodCenterId); // новый метод
}