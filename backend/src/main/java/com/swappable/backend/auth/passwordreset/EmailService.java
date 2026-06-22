package com.swappable.backend.auth.passwordreset;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.mail.from}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        log.info("Attempting to send reset email to: {}", toEmail);
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Reset your Swappable password");
        message.setText(
                "Hi,\n\n" +
                        "You requested a password reset for your Swappable account.\n\n" +
                        "Click the link below to reset your password. This link expires in 30 minutes.\n\n" +
                        resetLink + "\n\n" +
                        "If you did not request this, you can safely ignore this email.\n\n" +
                        "The Swappable Team"
        );

        mailSender.send(message);
        log.info("Reset email sent successfully to: {}", toEmail);
    }
}