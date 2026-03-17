package org.example.bloodconnect_monolit.bloodRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    // Запрос для получения всех заявок конкретного медцентра
    @Query("SELECT r FROM BloodRequest r WHERE r.medCenter.medCenterId = :id")
    List<BloodRequest> findByMedCenterId(@Param("id") Long id);
}