package org.example.bloodconnect_monolit.medCenter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/medcenter")
@CrossOrigin(origins = "http://localhost:3000")
public class MedCenterController {

    @Autowired
    private MedCenterRepository medCenterRepository;

    @GetMapping("/{id}")
    public ResponseEntity<MedCenter> getMedCenterById(@PathVariable Long id) {
        Optional<MedCenter> medCenter = medCenterRepository.findById(id);
        return medCenter.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMedCenterByUserId(@PathVariable Long userId) {
        Optional<MedCenter> medCenter = medCenterRepository.findByUser_UserId(userId);
        return medCenter.map(center -> {
            Map<String, Object> response = new HashMap<>();
            response.put("medCenterId", center.getMedCenterId());
            response.put("name", center.getName());
            response.put("location", center.getLocation());
            response.put("licenseFile", center.getLicenseFile());
            response.put("directorFullName", center.getDirectorFullName());
            response.put("specialization", center.getSpecialization());
            response.put("createdAt", center.getCreatedAt());
            response.put("verificationStatus", center.getVerificationStatus());
            response.put("rejectionReason", center.getRejectionReason());
            response.put("verifiedAt", center.getVerifiedAt());
            response.put("verifiedBy", center.getVerifiedBy());
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<MedCenter> updateMedCenter(@PathVariable Long id, @RequestBody MedCenter updatedMedCenter) {
        return medCenterRepository.findById(id)
                .map(medCenter -> {
                    medCenter.setName(updatedMedCenter.getName());
                    medCenter.setLocation(updatedMedCenter.getLocation());
                    medCenter.setDirectorFullName(updatedMedCenter.getDirectorFullName());
                    medCenter.setSpecialization(updatedMedCenter.getSpecialization());
                    medCenter.setLicenseFile(updatedMedCenter.getLicenseFile());
                    return ResponseEntity.ok(medCenterRepository.save(medCenter));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    public ResponseEntity<MedCenter> createMedCenter(@RequestBody MedCenter medCenter) {
        MedCenter savedMedCenter = medCenterRepository.save(medCenter);
        return ResponseEntity.ok(savedMedCenter);
    }

    @PutMapping("/{medCenterId}/license")
    public ResponseEntity<?> updateLicense(@PathVariable Long medCenterId, @RequestBody Map<String, String> request) {
        try {
            String licenseFile = request.get("licenseFile");
            Optional<MedCenter> centerOpt = medCenterRepository.findById(medCenterId);
            if (centerOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            MedCenter center = centerOpt.get();
            center.setLicenseFile(licenseFile);
            medCenterRepository.save(center);
            return ResponseEntity.ok(Map.of("message", "License updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{medCenterId}/verification-status")
    public ResponseEntity<?> getVerificationStatus(@PathVariable Long medCenterId) {
        Optional<MedCenter> centerOpt = medCenterRepository.findById(medCenterId);
        if (centerOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        MedCenter center = centerOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("status", center.getVerificationStatus());
        response.put("isApproved", "APPROVED".equals(center.getVerificationStatus()));
        response.put("rejectionReason", center.getRejectionReason());
        response.put("verifiedAt", center.getVerifiedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug/all")
    public ResponseEntity<?> debugAllMedCenters() {
        List<MedCenter> all = medCenterRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (MedCenter mc : all) {
            Map<String, Object> item = new HashMap<>();
            item.put("medCenterId", mc.getMedCenterId());
            item.put("name", mc.getName());
            item.put("licenseFile", mc.getLicenseFile());
            item.put("userId", mc.getUser().getUserId());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }
}