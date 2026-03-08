package org.example.bloodconnect_monolit.user.dto;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.securityConfig.JwtTokenProvider;
import org.example.bloodconnect_monolit.user.User;
import org.example.bloodconnect_monolit.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(user);

        return new AuthResponse(
                token,
                "Bearer",
                user.getUserId(),
                user.getEmail(),
                user.getRole()
        );
    }
}