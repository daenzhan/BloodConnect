package org.example.bloodconnect_monolit.bloodRequest;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bloodrequest")
@Data
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

    @Column(nullable = false)
    private Long medCenterId;

    @Column(nullable = false)
    private Long bloodBloodId;   // сделаем так чтобы медцентр выбирал нужный ему центр крови?
}
