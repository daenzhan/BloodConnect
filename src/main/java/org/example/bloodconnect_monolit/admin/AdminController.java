package org.example.bloodconnect_monolit.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.admin.dto.*;
import org.example.bloodconnect_monolit.admin.request.BlockUserRequest;
import org.example.bloodconnect_monolit.admin.request.VerifyLicenseRequest;
import org.example.bloodconnect_monolit.admin.request.CreateAdminRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserAdminDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users/block")
    public ResponseEntity<?> blockUser(@RequestBody BlockUserRequest request) {
        adminService.blockUser(request.getUserId(), request.isBlock(), request.getReason());
        Map<String, String> response = new HashMap<>();
        response.put("message", request.isBlock() ? "User blocked successfully" : "User unblocked successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long userId, @RequestParam String role) {
        adminService.changeUserRole(userId, role);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Role updated successfully");
        return ResponseEntity.ok(response);
    }


    @GetMapping("/licenses")
    public ResponseEntity<List<LicenseVerificationDTO>> getLicenses(@RequestParam(required = false) String status) {
        if ("PENDING".equals(status)) {
            return ResponseEntity.ok(adminService.getPendingLicenses());
        } else if ("APPROVED".equals(status)) {
            return ResponseEntity.ok(adminService.getApprovedLicenses());
        } else if ("REJECTED".equals(status)) {
            return ResponseEntity.ok(adminService.getRejectedLicenses());
        }
        return ResponseEntity.ok(adminService.getAllLicenses());
    }

    @GetMapping("/licenses/blood-centers")
    public ResponseEntity<List<LicenseVerificationDTO>> getBloodCenterLicenses() {
        return ResponseEntity.ok(adminService.getLicensesByType("BLOOD_CENTER"));
    }

    @GetMapping("/licenses/medical-centers")
    public ResponseEntity<List<LicenseVerificationDTO>> getMedicalCenterLicenses() {
        return ResponseEntity.ok(adminService.getLicensesByType("MEDICAL_CENTER"));
    }

    @GetMapping("/licenses/pending")
    public ResponseEntity<List<LicenseVerificationDTO>> getPendingLicenses() {
        return ResponseEntity.ok(adminService.getPendingLicenses());
    }


    @PostMapping("/licenses/verify")
    public ResponseEntity<?> verifyLicense(@Valid @RequestBody VerifyLicenseRequest request, Principal principal) {
        String adminEmail = principal.getName();
        Long adminId = adminService.getAdminIdByEmail(adminEmail);
        Long id = request.getId();
        String type = request.getType();
        adminService.verifyLicense(type, id, request.getStatus(), request.getRejectionReason(), adminId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "License " + request.getStatus().toLowerCase() + " successfully");
        return ResponseEntity.ok(response);
    }


    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        adminService.createAdmin(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin created successfully");
        return ResponseEntity.ok(response);
    }
}