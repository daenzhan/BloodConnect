package org.example.bloodconnect_monolit.bloodReserve;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.donation.Donation;

@Entity
@Table(name = "bloodreserves")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodReserve {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bloodReserveId;

    @Column(nullable = false)
    private String bloodGroup;

    @Column(nullable = false)
    private String rhesusFactor;

    @OneToOne
    @JoinColumn(name = "bloodCenterId", nullable = false)
    private BloodCenter bloodCenter;

    @ManyToOne
    @JoinColumn(name = "donationId", nullable = false)
    private Donation donation;
}
