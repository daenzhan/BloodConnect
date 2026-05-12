package org.example.bloodconnect_monolit.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminDTO {
    private Long userId;
    private String email;
    private String role;
    private String phoneNumber;
    private boolean isActive;
    private String blockedReason;
    private LocalDateTime createdAt;

    private Long bloodCenterId;
    private String bloodCenterName;
    private String bloodCenterLocation;
    private String bloodCenterVerificationStatus;

    private Long medCenterId;
    private String medCenterName;
    private String medCenterLocation;
    private String medCenterVerificationStatus;
}
