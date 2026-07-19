package com.swappable.backend.controller;

import com.swappable.backend.auth.AuthUtils;
import com.swappable.backend.auth.dto.UpdateProfileRequest;
import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock private UserRepository userRepository;

    private UserController controller;

    @BeforeEach
    void setUp() {
        controller = new UserController(userRepository);
    }

    private User user(int id, String username, String email, String location, String phoneNumber) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setUsername(username);
        u.setEmail(email);
        u.setLocation(location);
        u.setPhoneNumber(phoneNumber);
        return u;
    }

    // ---------- getMe (#6) ----------

    @Test
    void getMe_returnsAuthenticatedUsersProfile() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));

            var response = controller.getMe();

            assertEquals("owner", response.username());
            assertEquals("owner@test.com", response.email());
            assertEquals("Galway", response.location());
        }
    }

    @Test
    void getMe_throws404_whenUserNotFoundInDb() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.getMe());
            assertEquals(404, ex.getStatusCode().value());
        }
    }

    // ---------- updateMe ----------

    @Test
    void updateMe_throws409_whenNewUsernameAlreadyTaken() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");
        UpdateProfileRequest request = new UpdateProfileRequest("takenName", null, null);

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));
            when(userRepository.existsByUsername("takenName")).thenReturn(true);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> controller.updateMe(request));
            assertEquals(409, ex.getStatusCode().value());
        }
    }

    @Test
    void updateMe_allowsKeepingOwnUnchangedUsername() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");
        UpdateProfileRequest request = new UpdateProfileRequest("owner", "Dublin", null);

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));

            var response = controller.updateMe(request);

            assertEquals("owner", response.username());
            assertEquals("Dublin", response.location());
            verify(userRepository, never()).existsByUsername(anyString());
        }
    }

    @Test
    void updateMe_updatesLocationAndPhoneNumber() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");
        UpdateProfileRequest request = new UpdateProfileRequest(null, "Cork", "0879999999");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));

            var response = controller.updateMe(request);

            assertEquals("Cork", response.location());
            assertEquals("0879999999", response.phoneNumber());
            verify(userRepository).save(u);
        }
    }
}