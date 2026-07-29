package com.swappable.backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swappable.backend.auth.dto.ForgotPasswordRequest;
import com.swappable.backend.auth.dto.ResetPasswordRequest;
import com.swappable.backend.auth.passwordreset.PasswordResetService;
import com.swappable.backend.auth.security.JwtService;
import com.swappable.backend.auth.totp.TwoFactorService;
import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthService authService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private TwoFactorService twoFactorService;
    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;

    private AuthController controller;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        controller = new AuthController(authService, passwordResetService, twoFactorService, userRepository, jwtService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setValidator(new LocalValidatorFactoryBean())
                .build();
    }

    private User user(int id, String email, String username) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setEmail(email);
        u.setUsername(username);
        return u;
    }

    // ---------- forgot-password (#96) ----------

    @Test
    void forgotPassword_returns200_always() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("someone@test.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(passwordResetService).requestReset("someone@test.com");
    }

    @Test
    void forgotPassword_returns400_whenEmailBlank() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---------- reset-password (#98) ----------

    @Test
    void resetPassword_returns200_onValidToken() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("newPassword123");

        doNothing().when(passwordResetService).resetPassword("valid-token", "newPassword123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void resetPassword_returns400_onInvalidOrExpiredToken() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("bad-token");
        request.setNewPassword("newPassword123");

        doThrow(new IllegalArgumentException("Invalid or expired reset link"))
                .when(passwordResetService).resetPassword("bad-token", "newPassword123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ---------- 2fa/validate (#110) ----------

    @Test
    void validate2Fa_returns400_whenMissingFields() throws Exception {
        mockMvc.perform(post("/api/auth/2fa/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("tempToken", "abc"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validate2Fa_returns401_whenInvalidTempToken() throws Exception {
        when(jwtService.isTempToken("bad-temp-token")).thenReturn(false);

        mockMvc.perform(post("/api/auth/2fa/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "tempToken", "bad-temp-token", "code", "123456"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validate2Fa_returns400_whenInvalidCode() throws Exception {
        User u = user(1, "owner@test.com", "owner");
        when(jwtService.isTempToken("good-temp-token")).thenReturn(true);
        when(jwtService.extractEmail("good-temp-token")).thenReturn("owner@test.com");
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(u));
        when(twoFactorService.verifyCode(u, "000000")).thenReturn(false);

        mockMvc.perform(post("/api/auth/2fa/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "tempToken", "good-temp-token", "code", "000000"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validate2Fa_returns200_onValidCode() throws Exception {
        User u = user(1, "owner@test.com", "owner");
        when(jwtService.isTempToken("good-temp-token")).thenReturn(true);
        when(jwtService.extractEmail("good-temp-token")).thenReturn("owner@test.com");
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(u));
        when(twoFactorService.verifyCode(u, "123456")).thenReturn(true);
        when(jwtService.generateToken(u)).thenReturn("real-jwt-token");

        mockMvc.perform(post("/api/auth/2fa/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "tempToken", "good-temp-token", "code", "123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("real-jwt-token"));
    }
}