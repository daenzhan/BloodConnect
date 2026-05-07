package org.example.bloodconnect_monolit.admin.request;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.medCenter.MedCenterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class VerificationChecker {

    private final BloodCenterRepository bloodCenterRepository;
    private final MedCenterRepository medCenterRepository;

    public Optional<ResponseEntity<?>> checkBloodCenterAccess(Long bloodCenterId, String userId) {
        return bloodCenterRepository.findById(bloodCenterId)
                .map(center -> {
                    if (!"APPROVED".equals(center.getVerificationStatus())) {
                        return ResponseEntity.status(403).body(Map.of(
                                "error", "Your account is pending verification. Please wait for admin approval.",
                                "status", center.getVerificationStatus()
                        ));
                    }
                    return null;
                });
    }

    public Optional<ResponseEntity<?>> checkMedicalCenterAccess(Long medCenterId, String userId) {
        return medCenterRepository.findById(medCenterId)
                .map(center -> {
                    if (!"APPROVED".equals(center.getVerificationStatus())) {
                        return ResponseEntity.status(403).body(Map.of(
                                "error", "Your account is pending verification. Please wait for admin approval.",
                                "status", center.getVerificationStatus()
                        ));
                    }
                    return null;
                });
    }
}