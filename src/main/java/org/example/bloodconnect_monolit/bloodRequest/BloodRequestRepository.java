package org.example.bloodconnect_monolit.bloodRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    // Метод для поиска по ID медцентра
    List<BloodRequest> findByMedCenter_MedCenterId(Long medCenterId);

    // Альтернативный метод с JPQL
    @Query("SELECT br FROM BloodRequest br WHERE br.medCenter.medCenterId = :medCenterId")
    List<BloodRequest> findByMedCenterId(@Param("medCenterId") Long medCenterId);

    // Поиск по статусу
    List<BloodRequest> findByStatus(String status);

    // Поиск по медцентру и статусу
    List<BloodRequest> findByMedCenter_MedCenterIdAndStatus(Long medCenterId, String status);
}