package org.example.bloodconnect_monolit.donor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Long> {
    Optional<Donor> findByUser_UserId(Long userId);
    boolean existsByUser_UserId(Long userId);
    Optional<Donor> findByUser_Email(String email);
    boolean existsByIin(String iin);
    List<Donor> findByBloodGroupAndRhesusFactorAndDonorStatus(
            String bloodGroup,
            String rhesusFactor,
            String donorStatus
    );
    List<Donor> findByLastDonationDateBeforeOrLastDonationDateIsNull(LocalDate date);
    List<Donor> findByDonorStatus(String donorStatus);
    List<Donor> findByCity(String city);
    List<Donor> findByRatingGreaterThanEqual(Integer rating);
    List<Donor> findByPointsGreaterThanEqual(Integer points);
    long countByBloodGroup(String bloodGroup);
    long countByDonorStatus(String donorStatus);
    List<Donor> findByWeightBetween(Double minWeight, Double maxWeight);
    List<Donor> findByHeightBetween(Double minHeight, Double maxHeight);
    List<Donor> findByGender(String gender);
    List<Donor> findByBirthDateBetween(LocalDate startDate, LocalDate endDate);

}