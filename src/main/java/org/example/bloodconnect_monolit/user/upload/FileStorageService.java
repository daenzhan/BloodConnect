package org.example.bloodconnect_monolit.user.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    public String saveFile(MultipartFile file, String type, Long id) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String filename = type + "_" + id + "_" + UUID.randomUUID().toString() + extension;

        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, file.getBytes());

        return filename;
    }

    public void deleteFile(String filename) throws IOException {
        if (filename != null && !filename.isEmpty()) {
            Path filePath = Paths.get(uploadDir).resolve(filename);
            Files.deleteIfExists(filePath);
        }
    }

    public byte[] getFile(String filename) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(filename);
        return Files.readAllBytes(filePath);
    }
}