package org.example.bloodconnect_monolit.user.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
@CrossOrigin(origins = "http://localhost:3000")
public class UploadController {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @PostMapping("/license")
    public ResponseEntity<?> uploadLicense(@RequestParam("file") MultipartFile file,
                                           @RequestParam("type") String type,
                                           @RequestParam("id") Long id) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = type + "_" + id + "_" + UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.write(filePath, file.getBytes());

            Map<String, String> response = new HashMap<>();
            response.put("fileName", filename);
            response.put("filePath", "/uploads/" + filename);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload file"));
        }
    }
}
