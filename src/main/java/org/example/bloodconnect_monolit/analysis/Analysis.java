package org.example.bloodconnect_monolit.analysis;


import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis")
@Data
public class Analysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long analysisId;

    @Column(nullable = false)
    private String status;

    private String hiv; // ВИЧ
    private String brucellosis;
    private String hepatitisB;
    private String hepatitisC;
    private String syphilis;
    private Double altLevel;  // убрать?
    private String bloodGroup;
    private String rhesusFactor;
    private Double hemoglobin;
    private LocalDateTime analysisDate;
    private String technicianNotes;

    @Column(nullable = false)
    private Long donationId;  // внутри есть bloodCenterId и donorId

    @Column(nullable = false)
    private Long bloodCenterId;

}
