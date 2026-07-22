package com.swappable.backend.auth;

import com.swappable.backend.auth.dto.LoginRequest;
import com.swappable.backend.auth.dto.RegisterRequest;
import com.swappable.backend.auth.security.JwtService;
import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    private User user(int id, String username, String email, String passwordHash, boolean totpEnabled) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(passwordHash);
        u.setTotpEnabled(totpEnabled);
        return u;
    }

    // ---------- register (#48) ----------

    @Test
    void register_throws409_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest("newuser", "taken@test.com", "Password123", "Galway", null, null);
        when(userRepository.existsByEmail("taken@test.com")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.register(request));
        assertEquals(409, ex.getStatusCode().value());
    }

    @Test
    void register_throws409_whenUsernameAlreadyExists() {
        RegisterRequest request = new RegisterRequest("takenuser", "new@test.com", "Password123", "Galway", null, null);
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("takenuser")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.register(request));
        assertEquals(409, ex.getStatusCode().value());
    }

    @Test
    void register_succeeds_andReturnsToken() {
        RegisterRequest request = new RegisterRequest("newuser", "new@test.com", "Password123", "Galway", 53.27, -9.05);
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("hashed-password");

        User savedUser = user(1, "newuser", "new@test.com", "hashed-password", false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("real-jwt-token");

        var response = authService.register(request);

        assertEquals("real-jwt-token", response.token());
        assertEquals("newuser", response.username());
        assertEquals("new@test.com", response.email());
    }

    // ---------- login (#48, #109) ----------

    @Test
    void login_throws401_whenEmailNotFound() {
        LoginRequest request = new LoginRequest("nobody@test.com", "password");
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(request));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void login_throws401_whenPasswordWrong() {
        User u = user(1, "owner", "owner@test.com", "hashed-password", false);
        LoginRequest request = new LoginRequest("owner@test.com", "wrongPassword");
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("wrongPassword", "hashed-password")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(request));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void login_returnsRealToken_when2FADisabled() {
        User u = user(1, "owner", "owner@test.com", "hashed-password", false);
        LoginRequest request = new LoginRequest("owner@test.com", "correctPassword");
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("correctPassword", "hashed-password")).thenReturn(true);
        when(jwtService.generateToken(u)).thenReturn("real-jwt-token");

        LoginResponse response = authService.login(request);

        assertEquals("real-jwt-token", response.token());
        assertFalse(response.requires2FA());
        assertNull(response.tempToken());
    }

    @Test
    void login_returnsTempToken_notRealToken_when2FAEnabled() {
        User u = user(1, "owner", "owner@test.com", "hashed-password", true);
        LoginRequest request = new LoginRequest("owner@test.com", "correctPassword");
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("correctPassword", "hashed-password")).thenReturn(true);
        when(jwtService.generateTempToken(u)).thenReturn("temp-token-abc");

        LoginResponse response = authService.login(request);

        assertTrue(response.requires2FA());
        assertEquals("temp-token-abc", response.tempToken());
        assertNull(response.token());
        verify(jwtService, never()).generateToken(any());
    }
}