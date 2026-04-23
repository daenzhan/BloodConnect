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
    @Column(name = "analysis_id")
    private Long analysisId;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "hiv")
    private String hiv;

    @Column(name = "brucellosis")
    private String brucellosis;

    @Column(name = "hepatitis_b")
    private String hepatitisB;

    @Column(name = "hepatitis_c")
    private String hepatitisC;

    @Column(name = "syphilis")
    private String syphilis;

    @Column(name = "alt_level")
    private Double altLevel;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "rhesus_factor")
    private String rhesusFactor;

    @Column(name = "hemoglobin")
    private Double hemoglobin;

    @Column(name = "analysis_date")
    private LocalDateTime analysisDate;

    @Column(name = "technician_notes")
    private String technicianNotes;

    @OneToOne
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @ManyToOne
    @JoinColumn(name = "blood_center_id", nullable = false)
    private BloodCenter bloodCenter;
}