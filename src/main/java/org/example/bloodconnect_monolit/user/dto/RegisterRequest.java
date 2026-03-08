package org.example.bloodconnect_monolit.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@(.+)$", message = "Email format is invalid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{6,}$",
            message = "Password must contain at least one digit, one lowercase, one uppercase, one special character and no spaces")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "ADMIN|DONOR|BLOOD_CENTER|MEDICAL_CENTER",
            message = "Role must be ADMIN, DONOR, BLOOD_CENTER, or MEDICAL_CENTER")
    private String role;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
    private String phoneNumber;

    private String fullName;
    private LocalDate birthDate;

    @Pattern(regexp = "^[0-9]{12}$", message = "IIN must be exactly 12 digits")
    private String iin;

    @Min(value = 30, message = "Weight must be at least 30 kg")
    @Max(value = 250, message = "Weight must not exceed 250 kg")
    private Double weight;

    @Min(value = 100, message = "Height must be at least 100 cm")
    @Max(value = 250, message = "Height must not exceed 250 cm")
    private Double height;

    private String bloodGroup;
    private String rhesusFactor;
    private String address;
    private String city;
    private String gender;
    private LocalDate lastDonationDate;


    private String bloodCenterName;
    private String bloodCenterLocation;
    private String bloodCenterCity;
    private String bloodCenterSpecialization;
    private String bloodCenterLicenseFile;
    private String bloodCenterDirectorFullName;
    private Double latitude;
    private Double longitude;


    private String medCenterName;
    private String medCenterLocation;
    private String medCenterPhone;
    private String medCenterLicenseFile;
    private String medCenterDirectorFullName;
    private String medCenterSpecialization;

    @JsonProperty("isDonorDataValid")
    public boolean isDonorDataValid() {
        return fullName != null && !fullName.trim().isEmpty() &&
                birthDate != null &&
                iin != null && iin.matches("^[0-9]{12}$") &&
                weight != null && weight >= 30 && weight <= 250 &&
                height != null && height >= 100 && height <= 250 &&
                address != null && !address.trim().isEmpty() &&
                city != null && !city.trim().isEmpty() &&
                gender != null && !gender.trim().isEmpty();
    }

    @JsonProperty("isDonorAgeValid")
    public boolean isDonorAgeValid() {
        if (birthDate == null) return false;
        LocalDate now = LocalDate.now();
        int age = now.getYear() - birthDate.getYear();
        if (birthDate.plusYears(age).isAfter(now)) {
            age--;
        }
        return age >= 18 && age <= 60;
    }

    @JsonProperty("isBloodCenterDataValid")
    public boolean isBloodCenterDataValid() {
        return bloodCenterName != null && !bloodCenterName.trim().isEmpty() &&
                bloodCenterLocation != null && !bloodCenterLocation.trim().isEmpty() &&
                bloodCenterCity != null && !bloodCenterCity.trim().isEmpty();
    }

    @JsonProperty("isMedicalCenterDataValid")
    public boolean isMedicalCenterDataValid() {
        return medCenterName != null && !medCenterName.trim().isEmpty() &&
                medCenterLocation != null && !medCenterLocation.trim().isEmpty() &&
                medCenterPhone != null && !medCenterPhone.trim().isEmpty() &&
                medCenterPhone.matches("^\\+?[0-9]{10,15}$");
    }
}