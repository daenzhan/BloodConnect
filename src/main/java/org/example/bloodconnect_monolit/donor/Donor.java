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
    @Column(name = "donor_id")
    private Long donorId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false, unique = true, length = 12)
    private String iin;

    @Column(nullable = false)
    private Double weight;

    @Column(nullable = false)
    private Double height;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "rhesus_factor")
    private String rhesusFactor;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String gender;

    @Column(name = "last_donation_date")
    private LocalDate lastDonationDate;

    @Column(name = "donation_count")
    private Integer donationCount;

    private Integer rating;

    private Integer points;

    @Column(name = "donor_status")
    private String donorStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        donationCount = 0;
        rating = 0;
        points = 0;
        donorStatus = "ACTIVE";
    }

    public String getFirstName() {
        if (fullName == null || fullName.trim().isEmpty()) return "Unknown";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts[0];
    }

    public String getLastName() {
        if (fullName == null || fullName.trim().isEmpty()) return "";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    // для форматирования группы крови с резус-фактором
    public String getFormattedBloodType() {
        if (bloodGroup == null) return "Unknown";
        String rh = "";
        if (rhesusFactor != null) {
            if (rhesusFactor.toLowerCase().contains("positive")) {
                rh = "+";
            } else if (rhesusFactor.toLowerCase().contains("negative")) {
                rh = "-";
            }
        }
        return bloodGroup + rh;
    }
}