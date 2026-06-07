package org.example.bloodconnect_monolit.bloodReserve;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;

import java.time.LocalDateTime;

@Entity
@Table(name = "blood_reserves")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodReserve {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reserve_id")
    private Long reserveId;

    @Column(name = "component_type", nullable = false)
    private String componentType;

    @Column(name = "blood_group", nullable = false)
    private String bloodGroup;

    @Column(name = "rhesus_factor", nullable = false)
    private String rhesusFactor;

    @Column(name = "in_quarantine", nullable = false)
    private Boolean inQuarantine = true;

    @Column(name = "quarantine_end_date")
    private LocalDateTime quarantineEndDate;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = false;

    @Column(name = "expiration_date", nullable = false)
    private LocalDateTime expirationDate;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "donation_id", nullable = false, unique = true)
    private Long donationId;

    @Column(name = "donor_id", nullable = false)
    private Long donorId;

    @Column(name = "analysis_id")
    private Long analysisId;

    @Column(name = "notes")
    private String notes;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @ManyToOne
    @JoinColumn(name = "blood_center_id", nullable = false)
    private BloodCenter bloodCenter;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        calculateExpirationDate();

        // for quarantine
        if ("PLASMA".equals(componentType)) {
            if (inQuarantine && quarantineEndDate == null) {
                quarantineEndDate = createdDate.plusDays(90);
            }
            isAvailable = false;
        } else {
            inQuarantine = false;
            isAvailable = true;
            quarantineEndDate = null;
        }
    }

    public void calculateExpirationDate() {
        LocalDateTime now = LocalDateTime.now();
        switch (componentType) {
            case "WHOLE_BLOOD":
                expirationDate = now.plusDays(35);
                break;
            case "RED_BLOOD_CELLS":
                expirationDate = now.plusDays(42);
                break;
            case "PLATELETS":
                expirationDate = now.plusDays(5);
                break;
            case "PLASMA":
                expirationDate = now.plusYears(3);
                break;
            default:
                expirationDate = now.plusDays(30);
        }
    }

    public boolean isReadyForDistribution() {
        return isAvailable &&
                !inQuarantine &&
                expirationDate.isAfter(LocalDateTime.now());
    }
}