package org.example.bloodconnect_monolit.donorCall;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonorCallRepository extends JpaRepository<DonorCall, Long> {

    List<DonorCall> findByDonorIdAndCreatedAtAfter(Long donorId, LocalDateTime since);

    @Query("SELECT dc.donorId FROM DonorCall dc WHERE dc.createdAt > :since AND dc.donorId IN :donorIds")
    List<Long> findRecentlyCalledDonorIds(@Param("since") LocalDateTime since, @Param("donorIds") List<Long> donorIds);

    List<DonorCall> findByBloodCenter_BloodCenterIdAndCreatedAtAfter(Long bloodCenterId, LocalDateTime since);

    List<DonorCall> findByStatusAndExpiresAtBefore(String status, LocalDateTime now);

    List<DonorCall> findByDonorIdAndStatus(Long donorId, String status);
}