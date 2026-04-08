package org.example.bloodconnect_monolit.donation;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.analysis.Analysis;
import org.example.bloodconnect_monolit.appointment.Appointment;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "donation_id")
    private Long donationId;

    @Column(name = "donation_date")
    private LocalDateTime donationDate;

    @Column(name = "has_analysis")
    private Boolean hasAnalysis;

    private String status;

    @ManyToOne
    @JoinColumn(name = "bloodcenter_id", nullable = false)
    private BloodCenter bloodCenter;

    @ManyToOne
    @JoinColumn(name = "donor_id", nullable = false)
    private Donor donor;

    @OneToOne
    @JoinColumn(name = "analysis_id")
    private Analysis analysis;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @PrePersist
    protected void onCreate() {
        donationDate = LocalDateTime.now();
        hasAnalysis = false;
        status = "PENDING";
    }
}