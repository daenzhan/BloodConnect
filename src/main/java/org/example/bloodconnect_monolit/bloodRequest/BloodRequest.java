package org.example.bloodconnect_monolit.bloodRequest;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.medCenter.MedCenter;

import java.time.LocalDateTime;

@Entity
@Table(name = "bloodrequests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bloodRequestId;

    @Column(nullable = false)
    private String componentType;

    @Column(nullable = false)
    private String bloodGroup;

    @Column(nullable = false)
    private String rhesusFactor;

    @Column(nullable = false)
    private String volume;

    private LocalDateTime deadline;

    private String status;

    private String comment;

    @ManyToOne
    @JoinColumn(name = "medCenterId", nullable = false)
    private MedCenter medCenter;

    @ManyToOne
    @JoinColumn(name = "bloodCenterId")
    private BloodCenter bloodCenter;
}