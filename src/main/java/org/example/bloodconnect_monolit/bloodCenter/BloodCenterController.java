package org.example.bloodconnect_monolit.bloodCenter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/blood-centers")
@CrossOrigin(origins = "http://localhost:3000")  // ЭТО ОЧЕНЬ ВАЖНО!
public class BloodCenterController {

    @Autowired
    private BloodCenterRepository bloodCenterRepository;

    @GetMapping
    public ResponseEntity<List<BloodCenter>> getAllBloodCenters() {
        List<BloodCenter> centers = bloodCenterRepository.findAll();
        return ResponseEntity.ok(centers);
    }
}