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
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "hiv")
    private String hiv; // "POSITIVE", "NEGATIVE", "PENDING"

    @Column(name = "brucellosis")
    private String brucellosis; // "POSITIVE", "NEGATIVE", "PENDING"

    @Column(name = "hepatitis_b")
    private String hepatitisB; // "POSITIVE", "NEGATIVE", "PENDING"

    @Column(name = "hepatitis_c")
    private String hepatitisC; // "POSITIVE", "NEGATIVE", "PENDING"

    @Column(name = "syphilis")
    private String syphilis; // "POSITIVE", "NEGATIVE", "PENDING"

    @Column(name = "alt_level")
    private Double altLevel; // норма: < 40

    @Column(name = "blood_group")
    private String bloodGroup; // A, B, AB, O

    @Column(name = "rhesus_factor")
    private String rhesusFactor; // POSITIVE, NEGATIVE

    @Column(name = "hemoglobin")
    private Double hemoglobin; // норма: > 125 для женщин, > 135 для мужчин

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

    @PrePersist
    protected void onCreate() {
        analysisDate = LocalDateTime.now();
        status = "PENDING";
    }

    // для проверки, годен ли донор
    public boolean isDonorEligible() {
        return "NEGATIVE".equals(hiv) &&
                "NEGATIVE".equals(hepatitisB) &&
                "NEGATIVE".equals(hepatitisC) &&
                "NEGATIVE".equals(syphilis) &&
                "NEGATIVE".equals(brucellosis) &&
                (altLevel == null || altLevel < 40) &&
                (hemoglobin == null || hemoglobin > 125); // минимальный порог
    }

    // для проверки, все ли анализы заполнены
    public boolean isComplete() {
        return hiv != null &&
                brucellosis != null &&
                hepatitisB != null &&
                hepatitisC != null &&
                syphilis != null &&
                bloodGroup != null &&
                rhesusFactor != null;
    }
}