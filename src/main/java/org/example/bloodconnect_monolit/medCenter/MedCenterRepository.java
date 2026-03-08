package org.example.bloodconnect_monolit.medCenter;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MedCenterRepository extends JpaRepository<MedCenter, Long> {
    Optional<MedCenter> findByUser_UserId(Long userId);
    boolean existsByUser_UserId(Long userId);
    Optional<MedCenter> findByUser_Email(String email);
}