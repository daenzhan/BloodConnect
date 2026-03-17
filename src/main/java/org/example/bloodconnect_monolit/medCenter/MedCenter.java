package org.example.bloodconnect_monolit.medCenter;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.user.User;
import java.time.LocalDateTime;

@Entity
@Table(name = "medcenters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "medcenter_id")
    private Long medCenterId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "license_file")
    private String licenseFile;

    @Column(name = "director_full_name")
    private String directorFullName;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}