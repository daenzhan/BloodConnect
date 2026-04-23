package org.example.bloodconnect_monolit.user.dto;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.securityConfig.JwtTokenProvider;
import org.example.bloodconnect_monolit.user.User;
import org.example.bloodconnect_monolit.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            if (!userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email not found");
            } else {
                throw new RuntimeException("Incorrect password");
            }
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid email or password");
        }

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