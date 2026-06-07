package org.example.bloodconnect_monolit.admin;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.admin.dto.*;
import org.example.bloodconnect_monolit.admin.request.CreateAdminRequest;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.bloodRequest.BloodRequest;
import org.example.bloodconnect_monolit.bloodRequest.BloodRequestRepository;
import org.example.bloodconnect_monolit.donation.DonationRepository;
import org.example.bloodconnect_monolit.email.EmailVerificationService;
import org.example.bloodconnect_monolit.medCenter.MedCenter;
import org.example.bloodconnect_monolit.medCenter.MedCenterRepository;
import org.example.bloodconnect_monolit.user.User;
import org.example.bloodconnect_monolit.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BloodCenterRepository bloodCenterRepository;
    private final MedCenterRepository medCenterRepository;
    private final DonationRepository donationRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminRepository adminRepository;
    private final EmailVerificationService emailVerificationService;

    public AdminStatsDTO getStats() {
        AdminStatsDTO stats = new AdminStatsDTO();

        stats.setTotalUsers(userRepository.count());
        stats.setTotalDonors(adminRepository.countDonors());
        stats.setTotalBloodCenters(adminRepository.countBloodCenters());
        stats.setTotalMedicalCenters(adminRepository.countMedicalCenters());

        stats.setPendingBloodCenters(bloodCenterRepository.countByVerificationStatus("PENDING"));
        stats.setPendingMedicalCenters(medCenterRepository.countByVerificationStatus("PENDING"));

        stats.setTotalDonations(donationRepository.count());
        stats.setTotalBloodRequests(bloodRequestRepository.count());
        stats.setPendingRequests(bloodRequestRepository.countByStatus("PENDING"));

        Map<String, Long> donationsByMonth = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < 6; i++) {
            LocalDateTime start = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0);
            String monthName = start.getMonth().toString() + " " + start.getYear();
            long count = donationRepository.countByDonationDateBetween(start, start.plusMonths(1));
            donationsByMonth.put(monthName, count);
        }
        stats.setDonationsByMonth(donationsByMonth);
        return stats;
    }

    public List<UserAdminDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserAdminDTO> result = new ArrayList<>();

        for (User user : users) {
            UserAdminDTO dto = new UserAdminDTO();
            dto.setUserId(user.getUserId());
            dto.setEmail(user.getEmail());
            dto.setRole(user.getRole());
            dto.setPhoneNumber(user.getPhoneNumber());
            dto.setActive(user.isActive());
            dto.setBlockedReason(user.getBlockedReason());
            dto.setCreatedAt(user.getCreatedAt());

            if ("BLOOD_CENTER".equals(user.getRole())) {
                bloodCenterRepository.findByUser_UserId(user.getUserId()).ifPresent(bc -> {
                    dto.setBloodCenterId(bc.getBloodCenterId());
                    dto.setBloodCenterName(bc.getName());
                    dto.setBloodCenterLocation(bc.getLocation());
                    dto.setBloodCenterVerificationStatus(bc.getVerificationStatus());
                });
            } else if ("MEDICAL_CENTER".equals(user.getRole())) {
                medCenterRepository.findByUser_UserId(user.getUserId()).ifPresent(mc -> {
                    dto.setMedCenterId(mc.getMedCenterId());
                    dto.setMedCenterName(mc.getName());
                    dto.setMedCenterLocation(mc.getLocation());
                    dto.setMedCenterVerificationStatus(mc.getVerificationStatus());
                });
            }
            result.add(dto);
        }
        return result;
    }

    public Long getAdminIdByEmail(String email) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return admin.getUserId();
    }

    @Transactional
    public void blockUser(Long userId, boolean block, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(!block);
        if (block) {
            user.setBlockedReason(reason);
        } else {
            user.setBlockedReason(null);
        }
        userRepository.save(user);
    }


    public List<LicenseVerificationDTO> getPendingLicenses() {
        List<LicenseVerificationDTO> result = new ArrayList<>();
        List<BloodCenter> pendingBloodCenters = bloodCenterRepository.findByVerificationStatus("PENDING");
        for (BloodCenter bc : pendingBloodCenters) {
            LicenseVerificationDTO dto = new LicenseVerificationDTO();
            dto.setId(bc.getBloodCenterId());
            dto.setType("BLOOD_CENTER");
            dto.setName(bc.getName());
            dto.setLocation(bc.getLocation());
            dto.setDirectorFullName(bc.getDirectorFullName());
            dto.setLicenseFile(bc.getLicenseFile());
            dto.setVerificationStatus(bc.getVerificationStatus());
            dto.setCreatedAt(bc.getCreatedAt());
            dto.setUserId(bc.getUser().getUserId());
            dto.setUserEmail(bc.getUser().getEmail());
            result.add(dto);
        }

        List<MedCenter> pendingMedCenters = medCenterRepository.findByVerificationStatus("PENDING");
        for (MedCenter mc : pendingMedCenters) {
            LicenseVerificationDTO dto = new LicenseVerificationDTO();
            dto.setId(mc.getMedCenterId());
            dto.setType("MEDICAL_CENTER");
            dto.setName(mc.getName());
            dto.setLocation(mc.getLocation());
            dto.setDirectorFullName(mc.getDirectorFullName());
            dto.setLicenseFile(mc.getLicenseFile());
            dto.setVerificationStatus(mc.getVerificationStatus());
            dto.setCreatedAt(mc.getCreatedAt());
            dto.setUserId(mc.getUser().getUserId());
            dto.setUserEmail(mc.getUser().getEmail());
            result.add(dto);
        }

        return result;
    }

    @Transactional
    public User createAdmin(CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User admin = new User();
        admin.setEmail(request.getEmail());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole("ADMIN");
        admin.setPhoneNumber(request.getPhoneNumber());
        admin.setActive(true);

        return userRepository.save(admin);
    }

    @Transactional
    public void changeUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(newRole);
        userRepository.save(user);
    }

    public List<LicenseVerificationDTO> getAllLicenses() {
        List<LicenseVerificationDTO> result = new ArrayList<>();
        List<BloodCenter> allBloodCenters = bloodCenterRepository.findAll();
        for (BloodCenter bc : allBloodCenters) {
            LicenseVerificationDTO dto = new LicenseVerificationDTO();
            dto.setId(bc.getBloodCenterId());
            dto.setType("BLOOD_CENTER");
            dto.setName(bc.getName());
            dto.setLocation(bc.getLocation());
            dto.setDirectorFullName(bc.getDirectorFullName());
            dto.setLicenseFile(bc.getLicenseFile());
            dto.setVerificationStatus(bc.getVerificationStatus());
            dto.setRejectionReason(bc.getRejectionReason());
            dto.setCreatedAt(bc.getCreatedAt());
            dto.setUserId(bc.getUser().getUserId());
            dto.setUserEmail(bc.getUser().getEmail());
            result.add(dto);
        }

        List<MedCenter> allMedCenters = medCenterRepository.findAll();
        for (MedCenter mc : allMedCenters) {
            LicenseVerificationDTO dto = new LicenseVerificationDTO();
            dto.setId(mc.getMedCenterId());
            dto.setType("MEDICAL_CENTER");
            dto.setName(mc.getName());
            dto.setLocation(mc.getLocation());
            dto.setDirectorFullName(mc.getDirectorFullName());
            dto.setLicenseFile(mc.getLicenseFile());
            dto.setVerificationStatus(mc.getVerificationStatus());
            dto.setRejectionReason(mc.getRejectionReason());
            dto.setCreatedAt(mc.getCreatedAt());
            dto.setUserId(mc.getUser().getUserId());
            dto.setUserEmail(mc.getUser().getEmail());
            result.add(dto);
        }
        return result;
    }

    public List<LicenseVerificationDTO> getApprovedLicenses() {
        return getAllLicenses().stream()
                .filter(l -> "APPROVED".equals(l.getVerificationStatus()))
                .collect(Collectors.toList());
    }

    public List<LicenseVerificationDTO> getRejectedLicenses() {
        return getAllLicenses().stream()
                .filter(l -> "REJECTED".equals(l.getVerificationStatus()))
                .collect(Collectors.toList());
    }

    public List<LicenseVerificationDTO> getLicensesByType(String type) {
        return getAllLicenses().stream()
                .filter(l -> type.equals(l.getType()))
                .collect(Collectors.toList());
    }



    @Transactional
    public void verifyLicense(String type, Long id, String status, String rejectionReason, Long adminId) {
        String userEmail = null;
        String centerName = null;

        if ("BLOOD_CENTER".equals(type)) {
            BloodCenter center = bloodCenterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Blood center not found"));
            center.setVerificationStatus(status);
            center.setRejectionReason(rejectionReason);
            center.setVerifiedBy(adminId);
            center.setVerifiedAt(LocalDateTime.now());
            bloodCenterRepository.save(center);
            userEmail = center.getUser().getEmail();
            centerName = center.getName();
        } else if ("MEDICAL_CENTER".equals(type)) {
            MedCenter center = medCenterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medical center not found"));
            center.setVerificationStatus(status);
            center.setRejectionReason(rejectionReason);
            center.setVerifiedBy(adminId);
            center.setVerifiedAt(LocalDateTime.now());
            medCenterRepository.save(center);
            userEmail = center.getUser().getEmail();
            centerName = center.getName();
        }

        if (userEmail != null) {
            try {
                emailVerificationService.sendVerificationStatusEmail(userEmail, type, status, rejectionReason, centerName);
                System.out.println("Verification email sent to: " + userEmail);
            } catch (Exception e) {
                System.err.println("Failed to send verification email: " + e.getMessage());
            }
        }

        System.out.println("License verified: " + type + " ID: " + id + " Status: " + status);
    }
}