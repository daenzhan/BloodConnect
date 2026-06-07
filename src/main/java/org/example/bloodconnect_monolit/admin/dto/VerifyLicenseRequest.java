package org.example.bloodconnect_monolit.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyLicenseRequest {
    private Long id;

    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Status is required")
    private String status;

    private String rejectionReason;
}
