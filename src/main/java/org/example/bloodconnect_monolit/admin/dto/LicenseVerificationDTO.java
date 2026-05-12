package org.example.bloodconnect_monolit.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LicenseVerificationDTO {
    private Long id;
    private String type; // BLOOD_CENTER or MEDICAL_CENTER
    private String name;
    private String location;
    private String directorFullName;
    private String licenseFile;
    private String verificationStatus;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private Long userId;
    private String userEmail;
}