package org.example.bloodconnect_monolit.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.user.dto.AuthResponse;
import org.example.bloodconnect_monolit.user.dto.AuthenticationService;
import org.example.bloodconnect_monolit.user.dto.LoginRequest;
import org.example.bloodconnect_monolit.user.dto.RegisterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
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
}