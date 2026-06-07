package org.example.bloodconnect_monolit.donorCall;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.bloodconnect_monolit.donor.Donor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DonorEmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${donor.call.urgent.subject:BloodConnect - Urgent Blood Donor Call}")
    private String urgentSubject;

    @Value("${donor.call.normal.subject:BloodConnect - Blood Donor Call}")
    private String normalSubject;

    public void sendDonationCallEmail(Donor donor, DonorCall call, String urgencyLevel) {
        try {
            String to = donor.getUser().getEmail();
            String subject = "URGENT".equals(urgencyLevel) ? urgentSubject : normalSubject;
            String text = buildEmailText(donor, call, urgencyLevel);

            sendEmail(to, subject, text);
            log.info("Donation call email sent to donor: {} ({})", donor.getDonorId(), to);
        } catch (Exception e) {
            log.error("Failed to send donation call email to donor {}: {}", donor.getDonorId(), e.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        message.setFrom("noreply@bloodconnect.com");
        mailSender.send(message);
    }

    private String buildEmailText(Donor donor, DonorCall call, String urgencyLevel) {
        String bloodType = call.getBloodGroup() +
                (call.getRhesusFactor().equalsIgnoreCase("POSITIVE") ? "+" : "-");

        StringBuilder sb = new StringBuilder();

        if ("URGENT".equals(urgencyLevel)) {
            sb.append("URGENT DONATION REQUEST\n");
            sb.append("========================\n\n");
        }

        sb.append("Dear ").append(donor.getFirstName()).append(" ").append(donor.getLastName()).append(",\n\n");

        sb.append("A blood donation request has been issued by a medical facility.\n");
        sb.append("Your blood type matches the current requirement.\n\n");

        sb.append("REQUEST DETAILS:\n");
        sb.append("----------------\n");
        sb.append("Blood Center: ").append(call.getBloodCenter().getName()).append("\n");
        sb.append("Location: ").append(call.getBloodCenter().getCity()).append("\n");
        sb.append("Required Blood Type: ").append(bloodType).append("\n");
        sb.append("Blood Component: ").append(formatComponent(call.getComponentType())).append("\n");

        if (call.getMessage() != null && !call.getMessage().isEmpty()) {
            sb.append("\nAdditional Information:\n");
            sb.append(call.getMessage()).append("\n");
        }

        sb.append("\nVALIDITY PERIOD:\n");
        sb.append("----------------\n");
        sb.append("This request is valid until: ").append(formatDateTime(call.getExpiresAt())).append("\n");

//        sb.append("\nACTION REQUIRED:\n");
//        sb.append("----------------\n");
//        sb.append("To confirm your participation, please visit your donor dashboard:\n");
//        sb.append("http://localhost:3000/dashboard/for-donor/calls\n\n");

        sb.append("If you are unable to donate, kindly decline the request through your dashboard.\n\n");


        sb.append("Thank you for your continued commitment to saving lives!\n\n");
        sb.append("Sincerely,\n");
        sb.append("BloodConnect Team\n");
        sb.append("support@bloodconnect.com");

        return sb.toString();
    }

    private String formatComponent(String componentType) {
        switch (componentType) {
            case "WHOLE_BLOOD": return "Whole Blood";
            case "RED_BLOOD_CELLS": return "Red Blood Cells";
            case "PLATELETS": return "Platelets";
            case "PLASMA": return "Plasma";
            case "CRYOPRECIPITATE": return "Cryoprecipitate";
            default: return componentType;
        }
    }

    private String formatDateTime(java.time.LocalDateTime dateTime) {
        if (dateTime == null) return "Not specified";
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        return dateTime.format(formatter);
    }
}