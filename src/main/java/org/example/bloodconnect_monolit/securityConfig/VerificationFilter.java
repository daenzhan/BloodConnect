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

@Component
@RequiredArgsConstructor
public class VerificationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final BloodCenterRepository bloodCenterRepository;
    private final MedCenterRepository medCenterRepository;

    // Эндпоинты, которые всегда доступны (даже без верификации)
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/auth/", "/admin/", "/home", "/api/files/download/", "/api/files/upload/license"
    );

    // Эндпоинты для обновления лицензии - всегда доступны для аутентифицированных пользователей
    private static final List<String> LICENSE_ENDPOINTS = Arrays.asList(
            "/license", "/licenses"
    );

    // Эндпоинты, которые требуют верификации (блокируются для PENDING)
    private static final List<String> RESTRICTED_FOR_BLOOD_CENTER = Arrays.asList(
            "/donations/", "/blood-reserves/", "/analyses/", "/appointments/", "/blood-requests/"
    );

    private static final List<String> RESTRICTED_FOR_MEDICAL_CENTER = Arrays.asList(
            "/blood-requests/create", "/blood-requests/execute"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // 1. Пропускаем публичные эндпоинты
        if (isPublicEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Получаем аутентификацию
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = authentication.getName();
        var userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        User user = userOpt.get();

        // 3. ADMIN и DONOR пропускаются всегда
        if (user.getRole().equals("ADMIN") || user.getRole().equals("DONOR")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Эндпоинты для обновления лицензии - пропускаем всегда (даже для PENDING)
        if (isLicenseEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Проверяем статус верификации для BLOOD_CENTER и MEDICAL_CENTER
        boolean isVerified = checkVerificationStatus(user);

        // Если не верифицирован и эндпоинт требует верификации - блокируем
        if (!isVerified && requiresVerification(user.getRole(), path)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Your account is pending verification. Please wait for admin approval.\",\"status\":\"PENDING\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        return PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
    }

    private boolean isLicenseEndpoint(String path) {
        return LICENSE_ENDPOINTS.stream().anyMatch(path::contains) && path.contains("PUT");
    }

    private boolean checkVerificationStatus(User user) {
        if (user.getRole().equals("BLOOD_CENTER")) {
            return bloodCenterRepository.findByUser_UserId(user.getUserId())
                    .map(bc -> "APPROVED".equals(bc.getVerificationStatus()))
                    .orElse(false);
        } else if (user.getRole().equals("MEDICAL_CENTER")) {
            return medCenterRepository.findByUser_UserId(user.getUserId())
                    .map(mc -> "APPROVED".equals(mc.getVerificationStatus()))
                    .orElse(false);
        }
        return true;
    }

    private boolean requiresVerification(String role, String path) {
        if (role.equals("BLOOD_CENTER")) {
            return RESTRICTED_FOR_BLOOD_CENTER.stream().anyMatch(path::contains);
        } else if (role.equals("MEDICAL_CENTER")) {
            return RESTRICTED_FOR_MEDICAL_CENTER.stream().anyMatch(path::contains);
        }
        return false;
    }
}