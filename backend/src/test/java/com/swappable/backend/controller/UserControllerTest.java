package com.swappable.backend.controller;

import com.swappable.backend.auth.AuthUtils;
import com.swappable.backend.auth.dto.UpdateProfileRequest;
import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import com.swappable.backend.item.Item;
import com.swappable.backend.item.ItemMapper;
import com.swappable.backend.item.ItemRepository;
import com.swappable.backend.item.ItemResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private ItemRepository itemRepository;
    @Mock private ItemMapper itemMapper;

    private UserController controller;

    @BeforeEach
    void setUp() {
        controller = new UserController(userRepository, itemRepository, itemMapper);
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
        UpdateProfileRequest request = new UpdateProfileRequest("takenName", null, null, null, null);

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
        UpdateProfileRequest request = new UpdateProfileRequest("owner", "Dublin", null, null, null);

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
        UpdateProfileRequest request = new UpdateProfileRequest(null, "Cork", "0879999999", null, null);

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));

            var response = controller.updateMe(request);

            assertEquals("Cork", response.location());
            assertEquals("0879999999", response.phoneNumber());
            verify(userRepository).save(u);
        }
    }

    @Test
    void updateMe_movesCoordinatesWithTheLocation() {
        User u = user(1, "owner", "owner@test.com", "Dublin", "0851234567");
        u.setLatitude(53.4065148);
        u.setLongitude(-6.2866677);
        // Dublin to Kerry, see issue #211
        UpdateProfileRequest request =
                new UpdateProfileRequest(null, "Kerry", null, 52.1453345, -9.5174011);

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));

            var response = controller.updateMe(request);

            assertEquals("Kerry", response.location());
            assertEquals(52.1453345, response.lat());
            assertEquals(-9.5174011, response.lng());
            assertEquals(52.1453345, u.getLatitude());
            assertEquals(-9.5174011, u.getLongitude());
            verify(userRepository).save(u);
        }
    }

    @Test
    void updateMe_keepsExistingCoordinates_whenRequestOmitsThem() {
        User u = user(1, "owner", "owner@test.com", "Dublin", "0851234567");
        u.setLatitude(53.4065148);
        u.setLongitude(-6.2866677);
        UpdateProfileRequest request = new UpdateProfileRequest("renamed", null, null, null, null);

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));
            when(userRepository.existsByUsername("renamed")).thenReturn(false);

            var response = controller.updateMe(request);

            assertEquals(53.4065148, response.lat());
            assertEquals(-6.2866677, response.lng());
        }
    }

    @Test
    void updateMe_ignoresCoordinates_whenOnlyOneOfThePairIsSent() {
        User u = user(1, "owner", "owner@test.com", "Dublin", "0851234567");
        u.setLatitude(53.4065148);
        u.setLongitude(-6.2866677);
        UpdateProfileRequest request = new UpdateProfileRequest(null, "Kerry", null, 52.1453345, null);

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));

            var response = controller.updateMe(request);

            assertEquals(53.4065148, response.lat());
            assertEquals(-6.2866677, response.lng());
        }
    }

    // ---------- deleteMyAccount (#199) ----------

    @Test
    void deleteMyAccount_deletesCurrentUser() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.of(u));

            controller.deleteMyAccount();

            verify(userRepository).delete(u);
        }
    }

    @Test
    void deleteMyAccount_throws404_whenUserNotFound() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(u);
            when(userRepository.findById(1)).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> controller.deleteMyAccount());
            assertEquals(404, ex.getStatusCode().value());
            verify(userRepository, never()).delete(any());
        }
    }

    // ---------- getPublicProfile (#170) ----------

    @Test
    void getPublicProfile_returns404_whenUserNotFound() {
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getPublicProfile(999, Pageable.unpaged()));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void getPublicProfile_returnsPublicFieldsAndOnlyAvailableItems() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");
        Pageable pageable = PageRequest.of(0, 18);
        when(userRepository.findById(1)).thenReturn(Optional.of(u));
        when(itemRepository.findByUserIdAndStatus(1, "available", pageable))
                .thenReturn(Page.empty(pageable));

        var response = controller.getPublicProfile(1, pageable);

        assertEquals(1, response.id());
        assertEquals("owner", response.username());
        assertEquals("Galway", response.location());
        assertTrue(response.items().content().isEmpty());
        assertEquals(0, response.items().totalElements());
        // PublicUserResponse has no email/phone accessor, so PII cannot leak
        verify(itemRepository).findByUserIdAndStatus(1, "available", pageable);
    }

    @Test
    void getPublicProfile_mapsItemsAndPagedMetadata() {
        User u = user(1, "owner", "owner@test.com", "Galway", "0851234567");
        Pageable pageable = PageRequest.of(0, 18);
        Item first = new Item();
        Item second = new Item();
        ItemResponse firstResponse = itemResponse(10, "First");
        ItemResponse secondResponse = itemResponse(11, "Second");

        when(userRepository.findById(1)).thenReturn(Optional.of(u));
        when(itemRepository.findByUserIdAndStatus(1, "available", pageable))
                .thenReturn(new PageImpl<>(List.of(first, second), pageable, 2));
        when(itemMapper.toResponse(first)).thenReturn(firstResponse);
        when(itemMapper.toResponse(second)).thenReturn(secondResponse);

        var response = controller.getPublicProfile(1, pageable);

        assertEquals(List.of(firstResponse, secondResponse), response.items().content());
        assertEquals(2, response.items().totalElements());
        assertEquals(1, response.items().totalPages());
    }

    private ItemResponse itemResponse(Integer id, String title) {
        return new ItemResponse(id, title, "desc", "Good", null, "available",
                1, "Books", 1, "owner", null, null, null, List.of(), null);
    }
}