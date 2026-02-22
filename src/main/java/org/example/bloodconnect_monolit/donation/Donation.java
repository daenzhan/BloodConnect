package org.example.bloodconnect_monolit.donation;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "donation")
@Data
public class Donation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long donationId;

    private LocalDateTime donationDate = LocalDateTime.now();
    private Boolean hasAnalysis;
    private String status;

    @Column(nullable = false)
    private Long bloodCenterId;

    @Column(nullable = false)
    private Long donorId;

    private Long analysisId;



}
