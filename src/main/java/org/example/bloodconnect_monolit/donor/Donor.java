package org.example.bloodconnect_monolit.donor;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.bloodconnect_monolit.user.User;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "donors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long donorId;

    @OneToOne
    @JoinColumn(name = "userId", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false, unique = true, length = 12)
    private String iin;

    @Column(nullable = false)
    private Double weight;

    @Column(nullable = false)
    private Double height;

    private String bloodGroup;

    private String rhesusFactor;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String gender;

    private LocalDate lastDonationDate;

    private Integer donationCount;

    private Integer rating;

    private Integer points;

    private String donorStatus;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        donationCount = 0;
        rating = 0;
        points = 0;
        donorStatus = "ACTIVE";
    }
}