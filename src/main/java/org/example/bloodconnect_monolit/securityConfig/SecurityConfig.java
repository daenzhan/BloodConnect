package org.example.bloodconnect_monolit.securityConfig;

import lombok.RequiredArgsConstructor;
import org.example.bloodconnect_monolit.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String[] allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,PATCH}")
    private String[] allowedMethods;

    @Value("${cors.allowed-headers:Authorization,Content-Type,Accept,Origin,X-Requested-With}")
    private String[] allowedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${cors.max-age:3600}")
    private long maxAge;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            UserDetailsService userDetailsService
    ) {
        return new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService);
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return email -> userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // === ПУБЛИЧНЫЕ ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/home", "/").permitAll()

                        // === DONOR ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.GET, "/donor/dashboard/**").hasRole("DONOR")
                        .requestMatchers(HttpMethod.GET, "/donor/top-donors").permitAll()
                        .requestMatchers(HttpMethod.GET, "/donor/current-donor-rank/**").hasRole("DONOR")

                        // === BLOOD CENTER ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.GET, "/blood-centers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/blood-centers/{bloodCenterId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/blood-centers/by-user/**").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/blood-centers/{bloodCenterId}/reserves").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/blood-centers/{bloodCenterId}/reserves").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.POST, "/blood-centers/{bloodCenterId}/reserves/add").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.POST, "/blood-centers/{bloodCenterId}/reserves/initialize").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/blood-centers/{bloodCenterId}/statistics").hasRole("BLOOD_CENTER")

                        // === MEDICAL CENTER ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.GET, "/medcenter/user/**").hasRole("MEDICAL_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/medcenter/update/**").hasRole("MEDICAL_CENTER")
                        .requestMatchers(HttpMethod.POST, "/medcenter/create").hasRole("MEDICAL_CENTER")
                        .requestMatchers(HttpMethod.GET, "/medcenter/{id}").hasRole("MEDICAL_CENTER")

                        // === APPOINTMENT ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.POST, "/appointments/create").hasRole("DONOR")
                        .requestMatchers(HttpMethod.PUT, "/appointments/{appointmentId}/start").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/appointments/{appointmentId}/complete-donation").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/appointments/{appointmentId}/cancel").hasAnyRole("DONOR", "BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/appointments/donor/**").hasRole("DONOR")
                        .requestMatchers(HttpMethod.GET, "/appointments/donor/{userId}/upcoming").hasRole("DONOR")
                        .requestMatchers(HttpMethod.GET, "/appointments/bloodcenter/**").hasRole("BLOOD_CENTER")

                        // === BLOOD REQUEST ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.POST, "/blood-requests/create").hasAnyRole("MEDICAL_CENTER", "BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/blood-requests/medcenter/**").hasRole("MEDICAL_CENTER")
                        .requestMatchers(HttpMethod.GET, "/blood-requests/bloodcenter/**").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/blood-requests/{id}").hasAnyRole("MEDICAL_CENTER", "BLOOD_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/blood-requests/{id}").hasRole("MEDICAL_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/blood-requests/{id}/status").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.DELETE, "/blood-requests/{id}").hasRole("MEDICAL_CENTER")
                        .requestMatchers(HttpMethod.GET, "/blood-requests/bloodcenter/{bloodCenterId}/pending/count").hasRole("BLOOD_CENTER")

                        // === DONATION ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.GET, "/donations/bloodcenter/**").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.POST, "/donations/create-from-appointment/**").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/donations/{donationId}/status-with-appointment").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/donations/donor/**").hasRole("DONOR")
                        .requestMatchers(HttpMethod.GET, "/donations/bloodcenter/{bloodCenterId}/date").hasRole("BLOOD_CENTER")

                        // === ANALYSIS ЭНДПОИНТЫ ===
                        .requestMatchers(HttpMethod.POST, "/analyses/create-for-donation/**").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/analyses/{analysisId}").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/analyses/donation/{donationId}").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/analyses/bloodcenter/{bloodCenterId}").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/analyses/bloodcenter/{bloodCenterId}/status/{status}").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.PUT, "/analyses/{analysisId}").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.PATCH, "/analyses/{analysisId}").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.DELETE, "/analyses/{analysisId}").hasRole("BLOOD_CENTER")
                        .requestMatchers(HttpMethod.GET, "/analyses/bloodcenter/{bloodCenterId}/stats").hasRole("BLOOD_CENTER")

                        // === ADMIN ===
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/stats").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/users/block").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/users/*/role").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/licenses/pending").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/licenses/verify").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/create-admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/files/upload/**").hasAnyRole("BLOOD_CENTER", "MEDICAL_CENTER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/files/download/**").permitAll()
                        // Все остальные запросы требуют аутентификации
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService) {
        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList(allowedMethods));
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders));
        configuration.setAllowCredentials(allowCredentials);
        configuration.setMaxAge(maxAge);
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Disposition"
        ));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}