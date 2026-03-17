package org.example.bloodconnect_monolit.medCenter;


import org.example.bloodconnect_monolit.bloodRequest.BloodRequest;

import org.example.bloodconnect_monolit.bloodRequest.BloodRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class MedCenterController {

    @Autowired
    private MedCenterRepository medCenterRepository;

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    // 1. Эндпоинт для получения инфо о медцентре
    @GetMapping("/medcenter/{id}/info")
    public ResponseEntity<MedCenter> getMedCenterInfo(@PathVariable Long id) {
        return medCenterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/show/own/requests")
    public ResponseEntity<List<BloodRequest>> getOwnRequests() {
        Long currentMedCenterId = 1L;
        List<BloodRequest> requests = bloodRequestRepository.findByMedCenterId(currentMedCenterId);
        return ResponseEntity.ok(requests);
    }
}
