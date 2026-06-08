package org.example.bloodconnect_monolit.admin;

import org.example.bloodconnect_monolit.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminRepository extends JpaRepository<User, Long> {
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'DONOR'")
    long countDonors();
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'BLOOD_CENTER'")
    long countBloodCenters();
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'MEDICAL_CENTER'")
    long countMedicalCenters();
    List<User> findByRole(String role);
    List<User> findByIsActive(boolean isActive);
    long countByIsActiveTrue();
    long countByIsActiveFalse();
}
