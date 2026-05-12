package org.example.bloodconnect_monolit.admin.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VerifyLicenseRequest {
    @NotNull(message = "ID is required")
    private Long id;
    @NotBlank(message = "Type is required")
    private String type;
    @NotBlank(message = "Status is required")
    private String status;
    private String rejectionReason;
}
