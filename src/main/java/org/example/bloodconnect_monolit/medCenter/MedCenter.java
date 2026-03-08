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
    private Long medCenterId;

    @OneToOne
    @JoinColumn(name = "userId", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String phone;

    private String licenseFile;

    private String directorFullName;

    private String specialization;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}