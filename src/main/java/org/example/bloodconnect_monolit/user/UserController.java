package org.example.bloodconnect_monolit.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.email.EmailVerificationService;
import org.example.bloodconnect_monolit.medCenter.MedCenterRepository;
import org.example.bloodconnect_monolit.user.dto.EmailVerificationRequest;
import org.example.bloodconnect_monolit.user.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationService authenticationService;
    private final EmailVerificationService emailVerificationService;
    private final BloodCenterRepository bloodCenterRepository;
    private final MedCenterRepository medCenterRepository;

    @PostMapping("/send-verification")
    public ResponseEntity<Map<String, String>> sendVerificationCode(
            @Valid @RequestBody EmailVerificationRequest request) {

        emailVerificationService.sendVerificationCode(request.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Verification code sent to " + request.getEmail());
        response.put("email", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, String>> verifyCode(
            @Valid @RequestBody VerifyCodeRequest request) {

        boolean isValid = emailVerificationService.verifyCode(request.getEmail(), request.getCode());

        if (!isValid) {
            throw new RuntimeException("Invalid or expired verification code");
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Email verified successfully");
        response.put("email", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error ->
                    errors.put(error.getField(), error.getDefaultMessage())
            );
            return ResponseEntity.badRequest().body(errors);
        }

        try {
            if (!emailVerificationService.isEmailVerified(request.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Email not verified. Please verify your email first.");
                return ResponseEntity.badRequest().body(error);
            }
            AuthResponse response = userService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authenticationService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found")) {
                error.put("error", "Email not found");
                error.put("message", "Email not found. Please check your email or register.");
            } else if (errorMessage.contains("password") || errorMessage.contains("incorrect")) {
                error.put("error", "Incorrect password");
                error.put("message", "Incorrect password. Please try again.");
            } else {
                error.put("error", errorMessage);
                error.put("message", "Invalid email or password");
            }

            return ResponseEntity.status(401).body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@RequestParam String email) {
        Map<String, Boolean> response = new HashMap<>();
        boolean exists = userService.isEmailExists(email);
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/check-iin")
    public ResponseEntity<Map<String, Boolean>> checkIinExists(@RequestParam String iin) {
        Map<String, Boolean> response = new HashMap<>();
        boolean exists = userService.isIinExists(iin);
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/check-phone")
    public ResponseEntity<Map<String, Boolean>> checkPhoneExists(@RequestParam String phone) {
        Map<String, Boolean> response = new HashMap<>();
        boolean exists = userService.isPhoneExists(phone);
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody EmailVerificationRequest request) {
        try {
            emailVerificationService.sendResetPasswordCode(request.getEmail());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Reset code sent to " + request.getEmail());
            response.put("email", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordConfirmRequest request) {
        try {
            boolean isValid = emailVerificationService.verifyCode(request.getEmail(), request.getCode());

            if (!isValid) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid or expired verification code");
                return ResponseEntity.badRequest().body(error);
            }
            userService.resetPassword(request.getEmail(), request.getNewPassword());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{userId}/verification-status")
    public ResponseEntity<?> getVerificationStatus(@PathVariable Long userId) {
        Optional<User> userOpt = userService.getUserByIdOptional(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("role", user.getRole());
        response.put("isActive", user.isEnabled());
        if ("BLOOD_CENTER".equals(user.getRole())) {
            bloodCenterRepository.findByUser_UserId(userId).ifPresent(bc -> {
                response.put("verificationStatus", bc.getVerificationStatus());
                response.put("rejectionReason", bc.getRejectionReason());
                response.put("centerName", bc.getName());
                response.put("centerId", bc.getBloodCenterId());
            });
        } else if ("MEDICAL_CENTER".equals(user.getRole())) {
            medCenterRepository.findByUser_UserId(userId).ifPresent(mc -> {
                response.put("verificationStatus", mc.getVerificationStatus());
                response.put("rejectionReason", mc.getRejectionReason());
                response.put("centerName", mc.getName());
                response.put("centerId", mc.getMedCenterId());
            });
        } else if ("DONOR".equals(user.getRole())) {
            response.put("verificationStatus", "APPROVED");
            response.put("donorStatus", "ACTIVE");
        } else {
            response.put("verificationStatus", "APPROVED");
        }
        return ResponseEntity.ok(response);
    }
}