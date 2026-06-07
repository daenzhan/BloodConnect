package org.example.bloodconnect_monolit.donorCall;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import java.time.LocalDateTime;

@Entity
@Table(name = "donor_calls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonorCall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "donor_id", nullable = false)
    private Long donorId;

    @ManyToOne
    @JoinColumn(name = "blood_center_id", nullable = false)
    private BloodCenter bloodCenter;

    @Column(name = "blood_group", nullable = false)
    private String bloodGroup;

    @Column(name = "rhesus_factor", nullable = false)
    private String rhesusFactor;

    @Column(name = "component_type", nullable = false)
    private String componentType;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "response")
    private String response;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        expiresAt = createdAt.plusHours(48);
        status = "PENDING";
    }
}