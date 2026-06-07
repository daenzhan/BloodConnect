package org.example.bloodconnect_monolit.securityConfig;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.bloodCenter.BloodCenterRepository;
import org.example.bloodconnect_monolit.medCenter.MedCenterRepository;
import org.example.bloodconnect_monolit.user.User;
import org.example.bloodconnect_monolit.user.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class VerificationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final BloodCenterRepository bloodCenterRepository;
    private final MedCenterRepository medCenterRepository;

    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/auth/", "/admin/", "/home", "/api/files/download/"
    );

    private static final Map<String, List<String>> ROLE_REQUIRED_VERIFICATION = Map.of(
            "BLOOD_CENTER", Arrays.asList(
                    "/donations/", "/blood-reserves/", "/blood-requests/", "/analyses/"
            ),
            "MEDICAL_CENTER", Arrays.asList(
                    "/blood-requests/", "/medcenter/"
            )
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {


        String path = request.getRequestURI();
        if (PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getRole().equals("BLOOD_CENTER") || user.getRole().equals("MEDICAL_CENTER")) {
                    checkVerificationStatus(user, request, response);
                }
            });
        }

        filterChain.doFilter(request, response);
    }

    private void checkVerificationStatus(User user, HttpServletRequest request, HttpServletResponse response) {
        boolean isVerified = false;

        if (user.getRole().equals("BLOOD_CENTER")) {
            isVerified = bloodCenterRepository.findByUser_UserId(user.getUserId())
                    .map(bc -> "APPROVED".equals(bc.getVerificationStatus()))
                    .orElse(false);
        } else if (user.getRole().equals("MEDICAL_CENTER")) {
            isVerified = medCenterRepository.findByUser_UserId(user.getUserId())
                    .map(mc -> "APPROVED".equals(mc.getVerificationStatus()))
                    .orElse(false);
        }


        if (!isVerified) {
            String path = request.getRequestURI();
            List<String> restrictedPaths = ROLE_REQUIRED_VERIFICATION.get(user.getRole());

            if (restrictedPaths != null && restrictedPaths.stream().anyMatch(path::startsWith)) {
                try {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Your account is pending verification. Please wait for admin approval.\",\"status\":\"PENDING\"}");
                } catch (IOException e) {

                }
            }
        }
    }
}
