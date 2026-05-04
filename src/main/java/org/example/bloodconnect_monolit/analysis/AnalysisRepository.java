package org.example.bloodconnect_monolit.analysis;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findByBloodCenter_BloodCenterId(Long bloodCenterId);

    Optional<Analysis> findByDonation_DonationId(Long donationId);

    List<Analysis> findByStatus(String status);

    @Query("SELECT a FROM Analysis a WHERE a.donation.donationId = :donationId")
    Optional<Analysis> findAnalysisByDonationId(@Param("donationId") Long donationId);

    @Query("SELECT a FROM Analysis a WHERE a.bloodCenter.bloodCenterId = :bloodCenterId AND a.status = :status")
    List<Analysis> findByBloodCenterAndStatus(@Param("bloodCenterId") Long bloodCenterId, @Param("status") String status);
}