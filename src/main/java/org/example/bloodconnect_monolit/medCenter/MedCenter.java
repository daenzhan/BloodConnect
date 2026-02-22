package org.example.bloodconnect_monolit.medCenter;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medcenters")
@Data
public class MedCenter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long medCenterId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String phone;

    @Column(unique = true, nullable = false)
    private Long userId;

    private String licenseFile;
    private String directorFullName;
    private String specialization;
    private LocalDateTime createdAt = LocalDateTime.now();
}
