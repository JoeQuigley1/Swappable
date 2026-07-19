package com.swappable.backend.auth.passwordreset;

import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;

    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(userRepository, tokenRepository, emailService, passwordEncoder);
    }

    private User user(int id, String email) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setEmail(email);
        return u;
    }

    @Test
    void requestReset_returnsSilently_whenEmailNotFound() {
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service.requestReset("nobody@test.com"));

        verifyNoInteractions(emailService);
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void requestReset_deletesOldTokens_savesNewToken_andSendsEmail() {
        User u = user(1, "owner@test.com");
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(u));

        service.requestReset("owner@test.com");

        verify(tokenRepository).deleteByUser(u);

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        assertEquals(u, tokenCaptor.getValue().getUser());
        assertNotNull(tokenCaptor.getValue().getToken());

        verify(emailService).sendPasswordResetEmail(eq("owner@test.com"), anyString());
    }

    @Test
    void resetPassword_throws_whenTokenNotFound() {
        when(tokenRepository.findByToken("missing")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword("missing", "newPassword123"));
    }

    @Test
    void resetPassword_throws_whenTokenAlreadyUsed() {
        User u = user(1, "owner@test.com");
        PasswordResetToken token = new PasswordResetToken(u, "used-token");
        token.setUsed(true);
        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword("used-token", "newPassword123"));
    }

    @Test
    void resetPassword_throws_whenTokenExpired() {
        User u = user(1, "owner@test.com");
        PasswordResetToken token = new PasswordResetToken(u, "expired-token");
        ReflectionTestUtils.setField(token, "expiresAt", LocalDateTime.now().minusMinutes(1));
        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword("expired-token", "newPassword123"));
    }

    @Test
    void resetPassword_updatesPassword_andMarksTokenUsed_onSuccess() {
        User u = user(1, "owner@test.com");
        PasswordResetToken token = new PasswordResetToken(u, "valid-token");
        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPassword123")).thenReturn("hashed-password");

        service.resetPassword("valid-token", "newPassword123");

        assertEquals("hashed-password", u.getPasswordHash());
        verify(userRepository).save(u);
        assertTrue(token.isUsed());
        verify(tokenRepository).save(token);
    }
}