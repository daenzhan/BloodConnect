package org.example.bloodconnect_monolit.analysis;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    Optional<Analysis> findByDonation_DonationId(Long donationId);
    List<Analysis> findByBloodCenter_BloodCenterId(Long bloodCenterId);
    List<Analysis> findByStatus(String status);
    @Query("SELECT a FROM Analysis a WHERE a.donation.donor.donorId = :donorId ORDER BY a.analysisDate DESC")
    Optional<Analysis> findLatestByDonorId(@Param("donorId") Long donorId);
    @Query("SELECT a FROM Analysis a WHERE a.donation.donor.donorId = :donorId ORDER BY a.analysisDate ASC")
    List<Analysis> findAllByDonorIdOrderByDateAsc(@Param("donorId") Long donorId);
    @Query("SELECT COUNT(a) > 0 FROM Analysis a WHERE a.donation.donor.donorId = :donorId AND a.hemoglobin IS NOT NULL AND a.hemoglobin < :threshold")
    boolean hasLowHemoglobinInHistory(@Param("donorId") Long donorId, @Param("threshold") double threshold);
}