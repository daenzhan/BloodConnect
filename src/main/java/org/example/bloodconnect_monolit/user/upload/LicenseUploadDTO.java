package org.example.bloodconnect_monolit.user.upload;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class LicenseUploadDTO {
    private MultipartFile licenseFile;
    private String type;
    private Long id;
}
