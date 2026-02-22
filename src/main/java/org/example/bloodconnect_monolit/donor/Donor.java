package org.example.bloodconnect_monolit.donor;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "donor")
@Data
public class Donor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long donorId;

    private String fullName;
    private LocalDate birthDate;
    private String bloodGroup;
    private String rhesusFactor;
    private String phoneNumber;
    private String address;
    private String city;
    private String gender;
    private LocalDateTime createdAt = LocalDateTime.now();
    private String email;
}
