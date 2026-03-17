package org.example.bloodconnect_monolit.medCenter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

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
    public ResponseEntity<MedCenter> getMedCenterByUserId(@PathVariable Long userId) {
        Optional<MedCenter> medCenter = medCenterRepository.findByUser_UserId(userId);
        return medCenter.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<MedCenter> updateMedCenter(@PathVariable Long id, @RequestBody MedCenter updatedMedCenter) {
        return medCenterRepository.findById(id)
                .map(medCenter -> {
                    medCenter.setName(updatedMedCenter.getName());
                    medCenter.setLocation(updatedMedCenter.getLocation());
                    medCenter.setPhone(updatedMedCenter.getPhone());
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
}