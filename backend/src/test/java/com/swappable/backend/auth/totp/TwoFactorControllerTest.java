package com.swappable.backend.auth.totp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swappable.backend.user.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TwoFactorControllerTest {

    @Mock private TwoFactorService twoFactorService;

    private TwoFactorController controller;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private User user;

    @BeforeEach
    void setUp() {
        controller = new TwoFactorController(twoFactorService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        user = new User();
        ReflectionTestUtils.setField(user, "id", 1);
        user.setUsername("owner");
        user.setEmail("owner@test.com");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    // ---------- status (#112) ----------

    @Test
    void getStatus_returnsTrue_whenEnabled() throws Exception {
        user.setTotpEnabled(true);
        authenticateAs(user);

        mockMvc.perform(get("/api/users/me/2fa/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totpEnabled").value(true));
    }

    @Test
    void getStatus_returnsFalse_whenDisabled() throws Exception {
        user.setTotpEnabled(false);
        authenticateAs(user);

        mockMvc.perform(get("/api/users/me/2fa/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totpEnabled").value(false));
    }

    // ---------- setup (#105, #106) ----------

    @Test
    void setup_returnsSecretAndQrCode_onSuccess() throws Exception {
        authenticateAs(user);
        when(twoFactorService.setupTotp(user)).thenReturn("SECRET123");
        when(twoFactorService.buildQrCodeUrl(user, "SECRET123"))
                .thenReturn("otpauth://totp/Swappable:owner@test.com?secret=SECRET123&issuer=Swappable");

        mockMvc.perform(post("/api/users/me/2fa/setup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secret").value("SECRET123"))
                .andExpect(jsonPath("$.qrCodeUrl").exists());
    }

    @Test
    void setup_returns400_whenAlreadyEnabled() throws Exception {
        authenticateAs(user);
        when(twoFactorService.setupTotp(user)).thenThrow(new IllegalArgumentException("2FA is already enabled"));

        mockMvc.perform(post("/api/users/me/2fa/setup"))
                .andExpect(status().isBadRequest());
    }

    // ---------- verify-setup (#107) ----------

    @Test
    void verifySetup_returns200_onValidCode() throws Exception {
        authenticateAs(user);
        doNothing().when(twoFactorService).verifySetup(user, "123456");

        mockMvc.perform(post("/api/users/me/2fa/verify-setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", "123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("2FA enabled"));
    }

    @Test
    void verifySetup_returns400_withErrorMessage_onInvalidCode() throws Exception {
        authenticateAs(user);
        doThrow(new IllegalArgumentException("Invalid code"))
                .when(twoFactorService).verifySetup(user, "000000");

        mockMvc.perform(post("/api/users/me/2fa/verify-setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("code", "000000"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid code"));
    }

    // ---------- disable (#111) ----------

    @Test
    void disable_returns200_onCorrectPassword() throws Exception {
        authenticateAs(user);
        doNothing().when(twoFactorService).disableTotp(user, "correctPassword");

        mockMvc.perform(delete("/api/users/me/2fa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "correctPassword"))))
                .andExpect(status().isOk());
    }

    @Test
    void disable_returns400_onIncorrectPassword() throws Exception {
        authenticateAs(user);
        doThrow(new IllegalArgumentException("Incorrect password"))
                .when(twoFactorService).disableTotp(user, "wrongPassword");

        mockMvc.perform(delete("/api/users/me/2fa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "wrongPassword"))))
                .andExpect(status().isBadRequest());
    }
}