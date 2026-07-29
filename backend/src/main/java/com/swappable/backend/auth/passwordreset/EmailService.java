package com.swappable.backend.auth.passwordreset;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final RestClient restClient;
    private final String brevoApiKey;
    private final String frontendUrl;
    private final String fromAddress;

    public EmailService(
            RestClient.Builder restClientBuilder,
            @Value("${brevo.api.url}") String brevoApiUrl,
            @Value("${brevo.api.key}") String brevoApiKey,
            @Value("${app.frontend.url}") String frontendUrl,
            @Value("${app.mail.from}") String fromAddress) {

        this.restClient = restClientBuilder
                .baseUrl(brevoApiUrl)
                .build();

        this.brevoApiKey = brevoApiKey;
        this.frontendUrl = frontendUrl;
        this.fromAddress = fromAddress;
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        log.info("Attempting to send reset email to: {}", toEmail);

        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String textContent =
                "Hi,\n\n" +
                        "You requested a password reset for your Swappable account.\n\n" +
                        "Click the link below to reset your password. " +
                        "This link expires in 30 minutes.\n\n" +
                        resetLink + "\n\n" +
                        "If you did not request this, you can safely ignore this email.\n\n" +
                        "The Swappable Team";

        BrevoEmailRequest request = new BrevoEmailRequest(
                new BrevoContact("Swappable", fromAddress),
                List.of(new BrevoContact(null, toEmail)),
                "Reset your Swappable password",
                textContent
        );

        try {
            BrevoEmailResponse response = restClient.post()
                    .uri("/v3/smtp/email")
                    .header("api-key", brevoApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(BrevoEmailResponse.class);

            if (response == null || response.messageId() == null) {
                throw new IllegalStateException(
                        "Brevo returned an empty response or no message ID"
                );
            }

            log.info(
                    "Reset email sent successfully to: {}. Message ID: {}",
                    toEmail,
                    response.messageId()
            );

        } catch (RestClientException exception) {
            log.error(
                    "Failed to send reset email to: {}",
                    toEmail,
                    exception
            );

            throw new IllegalStateException(
                    "Failed to send password reset email through Brevo",
                    exception
            );
        }
    }

    private record BrevoContact(
            String name,
            String email
    ) {
    }

    private record BrevoEmailRequest(
            BrevoContact sender,
            List<BrevoContact> to,
            String subject,
            String textContent
    ) {
    }

    private record BrevoEmailResponse(
            String messageId
    ) {
    }
}