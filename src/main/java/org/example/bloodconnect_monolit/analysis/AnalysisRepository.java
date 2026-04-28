package org.example.bloodconnect_monolit.analysis;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findByBloodCenter_BloodCenterId(Long bloodCenterId);
    Optional<Analysis> findByDonation_DonationId(Long donationId);
}