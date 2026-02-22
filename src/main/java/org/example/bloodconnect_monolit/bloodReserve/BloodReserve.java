package org.example.bloodconnect_monolit.bloodReserve;
import jakarta.persistence.*;

@Entity
@Table(name = "bloodreserve")
@Data
public class BloodReserve {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bloodReserveId;

    @Column(nullable = false)
    private String bloodGroup;

    @Column(nullable = false)
    private String rhesusFactor;

    @Column(nullable = false)
    private Long bloodCenterId;

    @Column(nullable = false)
    private Long donationId;
}
