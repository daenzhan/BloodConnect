package org.example.bloodconnect_monolit.bloodreserve;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BloodReserveRepository extends JpaRepository<BloodReserve, Long> {

    List<BloodReserve> findByBloodCenter_BloodCenterId(Long bloodCenterId);

    List<BloodReserve> findByDonationId(Long donationId);

    List<BloodReserve> findByBloodCenter_BloodCenterIdAndComponentType(
            Long bloodCenterId, String componentType);

    @Query("SELECT br FROM BloodReserve br WHERE br.bloodCenter.bloodCenterId = :bloodCenterId " +
            "AND br.isAvailable = true AND br.inQuarantine = false " +
            "AND br.expirationDate > :currentDate")
    List<BloodReserve> findAvailableReserves(@Param("bloodCenterId") Long bloodCenterId,
                                             @Param("currentDate") LocalDateTime currentDate);

    List<BloodReserve> findByBloodCenter_BloodCenterIdAndInQuarantineTrue(Long bloodCenterId);

    @Query("SELECT br.bloodGroup, br.rhesusFactor, COUNT(br) FROM BloodReserve br " +
            "WHERE br.bloodCenter.bloodCenterId = :bloodCenterId AND br.isAvailable = true " +
            "GROUP BY br.bloodGroup, br.rhesusFactor")
    List<Object[]> getInventoryStats(@Param("bloodCenterId") Long bloodCenterId);

    // Поиск подходящих резервов для выполнения заявки
    @Query("SELECT br FROM BloodReserve br WHERE " +
            "br.bloodCenter.bloodCenterId = :bloodCenterId " +
            "AND br.componentType = :componentType " +
            "AND br.bloodGroup = :bloodGroup " +
            "AND UPPER(br.rhesusFactor) = UPPER(:rhesusFactor) " +
            "AND br.isAvailable = true " +
            "AND br.inQuarantine = false " +
            "AND br.expirationDate > :currentDate " +
            "AND br.quantity > 0 " +
            "ORDER BY br.expirationDate ASC")
    List<BloodReserve> findSuitableReserves(@Param("bloodCenterId") Long bloodCenterId,
                                            @Param("componentType") String componentType,
                                            @Param("bloodGroup") String bloodGroup,
                                            @Param("rhesusFactor") String rhesusFactor,
                                            @Param("currentDate") LocalDateTime currentDate);
}