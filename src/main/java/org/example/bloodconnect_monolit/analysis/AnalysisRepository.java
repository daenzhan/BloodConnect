package org.example.bloodconnect_monolit.analysis;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    Optional<Analysis> findByDonation_DonationId(Long donationId);
    List<Analysis> findByBloodCenter_BloodCenterId(Long bloodCenterId);
    List<Analysis> findByStatus(String status);
}