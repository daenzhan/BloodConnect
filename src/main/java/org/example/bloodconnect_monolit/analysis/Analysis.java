package org.example.bloodconnect_monolit.analysis;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.donation.Donation;
import java.time.LocalDateTime;

@Entity
@Table(name = "analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Analysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long analysisId;

    @Column(nullable = false)
    private String status;

    private String hiv;
    private String brucellosis;
    private String hepatitisB;
    private String hepatitisC;
    private String syphilis;
    private Double altLevel;
    private String bloodGroup;
    private String rhesusFactor;
    private Double hemoglobin;
    private LocalDateTime analysisDate;
    private String technicianNotes;

    @OneToOne
    @JoinColumn(name = "donationId", nullable = false)
    private Donation donation;

    @ManyToOne
    @JoinColumn(name = "bloodCenterId", nullable = false)
    private BloodCenter bloodCenter;
}