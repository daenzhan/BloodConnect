package org.example.bloodconnect_monolit.user;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenter;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.donor.Donor;
import org.example.bloodconnect_monolit.donor.DonorRepository;
import org.example.bloodconnect_monolit.medCenter.MedCenter;
import org.example.bloodconnect_monolit.medCenter.MedCenterRepository;
import org.example.bloodconnect_monolit.securityConfig.JwtTokenProvider;
import org.example.bloodconnect_monolit.user.dto.AuthResponse;
import org.example.bloodconnect_monolit.user.dto.RegisterRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final DonorRepository donorRepository;
    private final BloodCenterRepository bloodCenterRepository;
    private final MedCenterRepository medCenterRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (!isValidEmail(request.getEmail())) {
            throw new RuntimeException("Invalid email format");
        }
        if ("DONOR".equals(request.getRole())) {
            if (donorRepository.existsByIin(request.getIin())) {
                throw new RuntimeException("Donor with this IIN already registered");
            }
            if (!request.isDonorAgeValid()) {
                throw new RuntimeException("Donor must be between 18 and 60 years old");
            }
            if (request.getWeight() < 50) {
                throw new RuntimeException("Donor weight must be at least 50 kg for blood donation");
            }
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhoneNumber());
        User savedUser = userRepository.save(user);
        switch (request.getRole()) {
            case "DONOR":
                createDonorProfile(savedUser, request);
                break;
            case "BLOOD_CENTER":
                createBloodCenterProfile(savedUser, request);
                break;
            case "MEDICAL_CENTER":
                createMedicalCenterProfile(savedUser, request);
                break;
            case "ADMIN":
                break;
            default:
                throw new RuntimeException("Invalid role: " + request.getRole());
        }
        String token = jwtTokenProvider.generateToken(savedUser);
        return new AuthResponse(
                token,
                "Bearer",
                savedUser.getUserId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    private boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$";
        return email.matches(emailRegex);
    }

    private void createDonorProfile(User user, RegisterRequest request) {
        if (!request.isDonorDataValid()) {
            throw new RuntimeException("Incomplete donor data. Please provide all required fields.");
        }
        Donor donor = new Donor();
        donor.setUser(user);
        donor.setFullName(request.getFullName());
        donor.setBirthDate(request.getBirthDate());
        donor.setIin(request.getIin());
        donor.setWeight(request.getWeight());
        donor.setHeight(request.getHeight());
        donor.setBloodGroup(request.getBloodGroup());
        donor.setRhesusFactor(request.getRhesusFactor());
        donor.setAddress(request.getAddress());
        donor.setCity(request.getCity());
        donor.setGender(request.getGender());
        donor.setLastDonationDate(request.getLastDonationDate());
        donorRepository.save(donor);
    }

    private void createBloodCenterProfile(User user, RegisterRequest request) {
        if (!request.isBloodCenterDataValid()) {
            throw new RuntimeException("Incomplete blood center data. Please provide all required fields.");
        }
        BloodCenter bloodCenter = new BloodCenter();
        bloodCenter.setUser(user);
        bloodCenter.setName(request.getBloodCenterName());
        bloodCenter.setLocation(request.getBloodCenterLocation());
        bloodCenter.setCity(request.getBloodCenterCity());
        bloodCenter.setSpecialization(request.getBloodCenterSpecialization());
        bloodCenter.setLicenseFile(request.getBloodCenterLicenseFile());
        bloodCenter.setDirectorFullName(request.getBloodCenterDirectorFullName());
        bloodCenter.setLatitude(request.getLatitude());
        bloodCenter.setLongitude(request.getLongitude());
        bloodCenterRepository.save(bloodCenter);
    }

    private void createMedicalCenterProfile(User user, RegisterRequest request) {
        if (!request.isMedicalCenterDataValid()) {
            throw new RuntimeException("Incomplete medical center data. Please provide all required fields.");
        }
        MedCenter medCenter = new MedCenter();
        medCenter.setUser(user);
        medCenter.setName(request.getMedCenterName());
        medCenter.setLocation(request.getMedCenterLocation());
        medCenter.setPhone(request.getMedCenterPhone());
        medCenter.setLicenseFile(request.getMedCenterLicenseFile());
        medCenter.setDirectorFullName(request.getMedCenterDirectorFullName());
        medCenter.setSpecialization(request.getMedCenterSpecialization());

        medCenterRepository.save(medCenter);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }
}