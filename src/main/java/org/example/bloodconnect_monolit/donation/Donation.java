package org.example.bloodconnect_monolit.donation;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.analysis.Analysis;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long donationId;

    private LocalDateTime donationDate;

    private Boolean hasAnalysis;

    private String status;

    @ManyToOne
    @JoinColumn(name = "bloodCenterId", nullable = false)
    private BloodCenter bloodCenter;

    @ManyToOne
    @JoinColumn(name = "donorId", nullable = false)
    private Donor donor;

    @OneToOne
    @JoinColumn(name = "analysisId")
    private Analysis analysis;

    @PrePersist
    protected void onCreate() {
        donationDate = LocalDateTime.now();
        hasAnalysis = false;
        status = "PENDING";
    }
}
