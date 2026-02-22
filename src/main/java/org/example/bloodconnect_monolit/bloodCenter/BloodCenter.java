package org.example.bloodconnect_monolit.bloodCenter;


import jakarta.persistence.*;

@Entity
@Table(name = "bloodcenter")
@Data
public class BloodCenter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bloodCenterId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String city

    private String specialization;
    private String licenseFile;
    private String directorFullName;

    private Double latitude;
    private Double longitude;

    @Column(unique = true, nullable = false)
    private Long bloodReserveId;

    @Column(unique = true, nullable = false)
    private Long userId;


}
