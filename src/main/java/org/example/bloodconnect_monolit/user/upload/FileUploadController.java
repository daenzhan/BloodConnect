package org.example.bloodconnect_monolit.user.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload/license")
    public ResponseEntity<?> uploadLicense(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type,
            @RequestParam("id") Long id) {
        try {
            String filename = fileStorageService.saveFile(file, type, id);

            Map<String, String> response = new HashMap<>();
            response.put("fileName", filename);
            response.put("message", "File uploaded successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String filename) {
        try {
            byte[] fileBytes = fileStorageService.getFile(filename);

            String contentType = determineContentType(filename);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(fileBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    private String determineContentType(String filename) {
        if (filename.endsWith(".pdf")) {
            return "application/pdf";
        } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (filename.endsWith(".png")) {
            return "image/png";
        }
        return "application/octet-stream";
    }
}
