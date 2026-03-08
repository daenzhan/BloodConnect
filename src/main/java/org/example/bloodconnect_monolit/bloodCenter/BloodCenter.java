package org.example.bloodconnect_monolit.bloodCenter;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodReserve.BloodReserve;
import org.example.bloodconnect_monolit.user.User;

@Entity
@Table(name = "bloodcenters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodCenter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bloodCenterId;

    @OneToOne
    @JoinColumn(name = "userId", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String city;

    private String specialization;

    private String licenseFile;

    private String directorFullName;

    private Double latitude;

    private Double longitude;

    @OneToOne(mappedBy = "bloodCenter")
    private BloodReserve bloodReserve;
}