package org.example.bloodconnect_monolit.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.bloodconnect_monolit.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository verificationRepository;
    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${verification.code.expiration:15}")
    private int expirationMinutes;

    private static final SecureRandom random = new SecureRandom();

    private String generateVerificationCode() {
        return String.format("%06d", random.nextInt(1000000));
    }

    @Transactional
    public void sendVerificationCode(String email) {
        log.info("Sending verification code to: {}", email);
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }
        verificationRepository.findByEmail(email).ifPresent(verificationRepository::delete);

        String code = generateVerificationCode();
        log.info("Generated code for {}: {}", email, code);

        EmailVerification verification = new EmailVerification();
        verification.setEmail(email);
        verification.setVerificationCode(code);
        verification.setVerified(false);
        verification.setExpiryDate(LocalDateTime.now().plusMinutes(expirationMinutes));
        verificationRepository.save(verification);

        try {
            sendEmail(email, code);
            log.info("Email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send verification email. Please try again.");
        }
    }

    private void sendEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("BloodConnect - Email Confirmation");
        message.setText(String.format(
                "Hello!\n\n" +
                        "You have started the registration process on BloodConnect.\n\n" +
                        "Your verification code: %s\n\n" +
                        "The code is valid for %d minutes.\n\n" +
                        "If you haven't started the registration process, just ignore this email.\n\n" +
                        "Sincerely,\n" +
                        "The BloodConnect Team",
                code, expirationMinutes
        ));
        message.setFrom("noreply@bloodconnect.com");

        mailSender.send(message);
    }

    @Transactional
    public boolean verifyCode(String email, String code) {
        log.info("Verifying code for email: {}", email);

        return verificationRepository.findByEmailAndVerificationCode(email, code)
                .map(verification -> {
                    if (verification.getExpiryDate().isAfter(LocalDateTime.now())) {
                        verification.setVerified(true);
                        verificationRepository.save(verification);
                        log.info("Email verified successfully: {}", email);
                        return true;
                    } else {
                        log.warn("Expired verification code for: {}", email);
                        return false;
                    }
                })
                .orElse(false);
    }

    public boolean isEmailVerified(String email) {
        return verificationRepository.findByEmail(email)
                .map(EmailVerification::isVerified)
                .orElse(false);
    }
}