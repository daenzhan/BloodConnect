package org.example.bloodconnect_monolit.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.email.EmailVerificationService;
import org.example.bloodconnect_monolit.user.dto.EmailVerificationRequest;
import org.example.bloodconnect_monolit.user.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationService authenticationService;
    private final EmailVerificationService emailVerificationService;

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
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
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
}