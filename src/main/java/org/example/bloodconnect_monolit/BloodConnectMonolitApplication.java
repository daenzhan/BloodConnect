package org.example.bloodconnect_monolit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class BloodConnectMonolitApplication {

    public static void main(String[] args) {
        SpringApplication.run(BloodConnectMonolitApplication.class, args);
    }
    private static void createUploadDirectory() {
        try {
            Path uploadPath = Paths.get("./uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println(" Uploads directory created at: " + uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println(" Failed to create uploads directory: " + e.getMessage());
        }
    }
}
