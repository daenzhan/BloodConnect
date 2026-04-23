package org.example.bloodconnect_monolit.bloodCenter;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.bloodReserve.BloodReserve;
import org.example.bloodconnect_monolit.user.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "bloodcenters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodCenter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bloodcenter_id")
    private Long bloodCenterId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "city",nullable = false)
    private String city;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "license_file")
    private String licenseFile;

    @Column(name = "director_full_name")
    private String directorFullName;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "bloodCenter")
    private BloodReserve bloodReserve;
}