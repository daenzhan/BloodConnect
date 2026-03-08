package org.example.bloodconnect_monolit.bloodCenter;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BloodCenterRepository extends JpaRepository<BloodCenter, Long> {
    Optional<BloodCenter> findByUser_UserId(Long userId);
    boolean existsByUser_UserId(Long userId);
    Optional<BloodCenter> findByUser_Email(String email);
}
