package org.example.bloodconnect_monolit.bloodRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {
    List<BloodRequest> findByMedCenter_MedCenterId(Long medCenterId);
    @Query("SELECT br FROM BloodRequest br WHERE br.medCenter.medCenterId = :medCenterId")
    List<BloodRequest> findByMedCenterId(@Param("medCenterId") Long medCenterId);
    List<BloodRequest> findByStatus(String status);
    List<BloodRequest> findByMedCenter_MedCenterIdAndStatus(Long medCenterId, String status);
    List<BloodRequest> findByBloodCenter_BloodCenterId(Long bloodCenterId); // новый метод
    long countByBloodCenter_BloodCenterIdAndStatus(Long bloodCenterId, String status);
    long countByStatus(String status);
}