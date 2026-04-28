package org.example.bloodconnect_monolit.bloodReserve;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BloodReserveRepository extends JpaRepository<BloodReserve, Long> {

    List<BloodReserve> findByBloodCenter_BloodCenterId(Long bloodCenterId);

    Optional<BloodReserve> findByBloodCenter_BloodCenterIdAndBloodGroupAndRhesusFactor(
            Long bloodCenterId, String bloodGroup, String rhesusFactor
    );

    void deleteByBloodCenter_BloodCenterId(Long bloodCenterId);
}