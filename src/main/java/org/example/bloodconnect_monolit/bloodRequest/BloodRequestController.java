package org.example.bloodconnect_monolit.bloodRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/blood-requests")
@CrossOrigin(origins = "http://localhost:3000")  // Добавьте CORS
public class BloodRequestController {

    @Autowired
    private BloodRequestRepository bloodRequestRepository;


    // CREATE new request - ЭТОТ МЕТОД НУЖЕН
    @PostMapping("/create")
    public ResponseEntity<BloodRequest> createBloodRequest(@RequestBody BloodRequest request) {
        try {
            System.out.println("Received request: " + request);

            // Set default values
            request.setStatus("PENDING");
            request.setCreateAt(LocalDateTime.now());

            BloodRequest savedRequest = bloodRequestRepository.save(request);
            System.out.println("Saved request with ID: " + savedRequest.getBloodRequestId());

            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
            System.err.println("Error creating request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // GET all requests for a medcenter - ЭТОТ МЕТОД НУЖЕН
    @GetMapping("/medcenter/{medCenterId}")
    public ResponseEntity<List<BloodRequest>> getRequestsByMedCenter(@PathVariable Long medCenterId) {
        List<BloodRequest> requests = bloodRequestRepository.findByMedCenter_MedCenterId(medCenterId);
        return ResponseEntity.ok(requests);
    }

    // Get single request
    @GetMapping("/{id}")
    public ResponseEntity<BloodRequest> getRequestById(@PathVariable Long id) {
        return bloodRequestRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update request
    @PutMapping("/{id}")
    public ResponseEntity<BloodRequest> updateRequest(@PathVariable Long id, @RequestBody BloodRequest updatedRequest) {
        return bloodRequestRepository.findById(id)
                .map(request -> {
                    request.setComponentType(updatedRequest.getComponentType());
                    request.setBloodGroup(updatedRequest.getBloodGroup());
                    request.setRhesusFactor(updatedRequest.getRhesusFactor());
                    request.setVolume(updatedRequest.getVolume());
                    request.setDeadline(updatedRequest.getDeadline());
                    request.setComment(updatedRequest.getComment());
                    return ResponseEntity.ok(bloodRequestRepository.save(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Update status
    @PutMapping("/{id}/status")
    public ResponseEntity<BloodRequest> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return bloodRequestRepository.findById(id)
                .map(request -> {
                    request.setStatus(status);
                    return ResponseEntity.ok(bloodRequestRepository.save(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete request
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        if (bloodRequestRepository.existsById(id)) {
            bloodRequestRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/bloodcenter/{bloodCenterId}")
    public ResponseEntity<List<BloodRequest>> getRequestsByBloodCenter(@PathVariable Long bloodCenterId) {
        return ResponseEntity.ok(bloodRequestRepository.findByBloodCenter_BloodCenterId(bloodCenterId));
    }
}