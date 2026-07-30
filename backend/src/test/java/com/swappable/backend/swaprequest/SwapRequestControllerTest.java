package com.swappable.backend.swaprequest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swappable.backend.auth.AuthUtils;
import com.swappable.backend.item.Item;
import com.swappable.backend.item.ItemRepository;
import com.swappable.backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SwapRequestControllerTest {

    @Mock private SwapRequestRepository swapRequestRepository;
    @Mock private ItemRepository itemRepository;

    private SwapRequestController controller;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        controller = new SwapRequestController(swapRequestRepository, itemRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private User user(int id, String username) {
        User u = new User();
        ReflectionTestUtils.setField(u, "id", id);
        u.setUsername(username);
        return u;
    }

    private Item item(int id, User owner, String status) {
        Item i = new Item();
        ReflectionTestUtils.setField(i, "id", id);
        i.setUser(owner);
        i.setStatus(status);
        i.setTitle("Item " + id);
        return i;
    }

    // ---------- createSwapRequest ----------

    @Test
    void createSwapRequest_returns400_whenRequestingOwnItem() throws Exception {
        User requester = user(1, "requester");
        Item requestedItem = item(100, requester, "available"); // requester owns the item they're requesting
        Item offeredItem = item(200, requester, "available");   // and offers their own item too

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(itemRepository.findById(100)).thenReturn(Optional.of(requestedItem));
            when(itemRepository.findById(200)).thenReturn(Optional.of(offeredItem));

            CreateSwapRequest request = new CreateSwapRequest(100, 200, "hi");

            mockMvc.perform(post("/api/swap-requests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void createSwapRequest_returns403_whenOfferingSomeoneElsesItem() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "available");
        Item offeredItem = item(200, owner, "available"); // NOT the requester's item

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(itemRepository.findById(100)).thenReturn(Optional.of(requestedItem));
            when(itemRepository.findById(200)).thenReturn(Optional.of(offeredItem));

            CreateSwapRequest request = new CreateSwapRequest(100, 200, "hi");

            mockMvc.perform(post("/api/swap-requests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void createSwapRequest_returns400_whenRequestedItemNotAvailable() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "swapped"); // not available
        Item offeredItem = item(200, requester, "available");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(itemRepository.findById(100)).thenReturn(Optional.of(requestedItem));
            when(itemRepository.findById(200)).thenReturn(Optional.of(offeredItem));

            CreateSwapRequest request = new CreateSwapRequest(100, 200, "hi");

            mockMvc.perform(post("/api/swap-requests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void createSwapRequest_returns400_whenDuplicatePendingRequestExists() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "available");
        Item offeredItem = item(200, requester, "available");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(itemRepository.findById(100)).thenReturn(Optional.of(requestedItem));
            when(itemRepository.findById(200)).thenReturn(Optional.of(offeredItem));
            when(swapRequestRepository.existsByRequesterIdAndRequestedItemIdAndOfferedItemIdAndStatus(
                    1, 100, 200, "pending")).thenReturn(true);

            CreateSwapRequest request = new CreateSwapRequest(100, 200, "hi");

            mockMvc.perform(post("/api/swap-requests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ---------- acceptSwapRequest / declineSwapRequest ----------

    @Test
    void acceptSwapRequest_returns403_whenNotOwner() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        User someoneElse = user(3, "intruder");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "available"));
        swapRequest.setOfferedItem(item(200, requester, "available"));
        swapRequest.setStatus("pending");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(someoneElse);
            when(swapRequestRepository.findById(50)).thenReturn(Optional.of(swapRequest));

            mockMvc.perform(post("/api/swap-requests/50/accept"))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void declineSwapRequest_returns400_whenAlreadyProcessed() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "swapped"));
        swapRequest.setOfferedItem(item(200, requester, "swapped"));
        swapRequest.setStatus("accepted"); // already processed

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(owner);
            when(swapRequestRepository.findById(50)).thenReturn(Optional.of(swapRequest));

            mockMvc.perform(post("/api/swap-requests/50/decline"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void acceptSwapRequest_succeeds_forOwner_andMarksItemsSwapped() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "available");
        Item offeredItem = item(200, requester, "available");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus("pending");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(owner);
            when(swapRequestRepository.findById(50)).thenReturn(Optional.of(swapRequest));
            when(swapRequestRepository.save(swapRequest)).thenReturn(swapRequest);

            mockMvc.perform(post("/api/swap-requests/50/accept"))
                    .andExpect(status().isOk());
        }

        org.junit.jupiter.api.Assertions.assertEquals("swapped", requestedItem.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("swapped", offeredItem.getStatus());
    }

    // ---------- confirmSwapRequest ----------

    @Test
    void confirmSwapRequest_returns403_whenNotParticipant() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        User someoneElse = user(3, "intruder");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "swapped"));
        swapRequest.setOfferedItem(item(200, requester, "swapped"));
        swapRequest.setStatus("accepted");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(someoneElse);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));

            mockMvc.perform(post("/api/swap-requests/50/confirm"))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void confirmSwapRequest_returns400_whenNotAccepted() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "available"));
        swapRequest.setOfferedItem(item(200, requester, "available"));
        swapRequest.setStatus("pending"); // not yet accepted

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(owner);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));

            mockMvc.perform(post("/api/swap-requests/50/confirm"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void confirmSwapRequest_keepsAccepted_whenOnlyOneSideConfirms() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "swapped");
        Item offeredItem = item(200, requester, "swapped");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus("accepted");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(owner);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));
            when(swapRequestRepository.save(swapRequest)).thenReturn(swapRequest);

            mockMvc.perform(post("/api/swap-requests/50/confirm"))
                    .andExpect(status().isOk());
        }

        org.junit.jupiter.api.Assertions.assertEquals("accepted", swapRequest.getStatus());
        org.junit.jupiter.api.Assertions.assertTrue(swapRequest.isOwnerConfirmed());
        org.junit.jupiter.api.Assertions.assertFalse(swapRequest.isRequesterConfirmed());
        org.junit.jupiter.api.Assertions.assertNull(swapRequest.getCompletedAt());
        org.junit.jupiter.api.Assertions.assertFalse(requestedItem.isArchived());
        org.junit.jupiter.api.Assertions.assertFalse(offeredItem.isArchived());
    }

    @Test
    void confirmSwapRequest_completesAndArchivesItems_whenBothSidesConfirm() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "swapped");
        Item offeredItem = item(200, requester, "swapped");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus("accepted");
        swapRequest.setOwnerConfirmed(true); // owner already confirmed

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));
            when(swapRequestRepository.save(swapRequest)).thenReturn(swapRequest);

            mockMvc.perform(post("/api/swap-requests/50/confirm"))
                    .andExpect(status().isOk());
        }

        org.junit.jupiter.api.Assertions.assertEquals("completed", swapRequest.getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(swapRequest.getCompletedAt());
        org.junit.jupiter.api.Assertions.assertTrue(requestedItem.isArchived());
        org.junit.jupiter.api.Assertions.assertTrue(offeredItem.isArchived());
    }

    // ---------- abandonSwapRequest (#215) ----------

    @Test
    void abandonSwapRequest_cancelsAndFreesItems_whenOwnerAbandons() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "swapped");
        Item offeredItem = item(200, requester, "swapped");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus("accepted");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(owner);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));
            when(swapRequestRepository.save(swapRequest)).thenReturn(swapRequest);

            mockMvc.perform(post("/api/swap-requests/50/abandon"))
                    .andExpect(status().isOk());
        }

        org.junit.jupiter.api.Assertions.assertEquals("cancelled", swapRequest.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("available", requestedItem.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("available", offeredItem.getStatus());
        org.junit.jupiter.api.Assertions.assertFalse(requestedItem.isArchived());
        org.junit.jupiter.api.Assertions.assertFalse(offeredItem.isArchived());
    }

    @Test
    void abandonSwapRequest_clearsConfirmations_whenRequesterAbandonsAfterOwnerConfirmed() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        Item requestedItem = item(100, owner, "swapped");
        Item offeredItem = item(200, requester, "swapped");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus("accepted");
        swapRequest.setOwnerConfirmed(true); // the other side confirmed and then went quiet

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));
            when(swapRequestRepository.save(swapRequest)).thenReturn(swapRequest);

            mockMvc.perform(post("/api/swap-requests/50/abandon"))
                    .andExpect(status().isOk());
        }

        org.junit.jupiter.api.Assertions.assertEquals("cancelled", swapRequest.getStatus());
        org.junit.jupiter.api.Assertions.assertFalse(swapRequest.isOwnerConfirmed());
        org.junit.jupiter.api.Assertions.assertFalse(swapRequest.isRequesterConfirmed());
        org.junit.jupiter.api.Assertions.assertNull(swapRequest.getCompletedAt());
    }

    @Test
    void abandonSwapRequest_returns403_whenNotParticipant() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");
        User someoneElse = user(3, "intruder");
        Item requestedItem = item(100, owner, "swapped");
        Item offeredItem = item(200, requester, "swapped");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus("accepted");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(someoneElse);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));

            mockMvc.perform(post("/api/swap-requests/50/abandon"))
                    .andExpect(status().isForbidden());
        }

        org.junit.jupiter.api.Assertions.assertEquals("swapped", requestedItem.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("swapped", offeredItem.getStatus());
        verify(swapRequestRepository, never()).save(any(SwapRequest.class));
    }

    @Test
    void abandonSwapRequest_returns400_whenRequestIsStillPending() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "available"));
        swapRequest.setOfferedItem(item(200, requester, "available"));
        swapRequest.setStatus("pending");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));

            mockMvc.perform(post("/api/swap-requests/50/abandon"))
                    .andExpect(status().isBadRequest());
        }

        verify(swapRequestRepository, never()).save(any(SwapRequest.class));
    }

    @Test
    void abandonSwapRequest_returns400_whenSwapAlreadyCompleted() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "swapped"));
        swapRequest.setOfferedItem(item(200, requester, "swapped"));
        swapRequest.setStatus("completed");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(owner);
            when(swapRequestRepository.findByIdForUpdate(50)).thenReturn(Optional.of(swapRequest));

            mockMvc.perform(post("/api/swap-requests/50/abandon"))
                    .andExpect(status().isBadRequest());
        }

        verify(swapRequestRepository, never()).save(any(SwapRequest.class));
    }

    @Test
    void abandonSwapRequest_returns404_whenRequestDoesNotExist() throws Exception {
        User requester = user(1, "requester");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(swapRequestRepository.findByIdForUpdate(999)).thenReturn(Optional.empty());

            mockMvc.perform(post("/api/swap-requests/999/abandon"))
                    .andExpect(status().isNotFound());
        }

        verify(swapRequestRepository, never()).save(any(SwapRequest.class));
    }

    // ---------- cancelSwapRequest ----------

    @Test
    void cancelSwapRequest_returns204_andDeletesPendingRequest() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "available"));
        swapRequest.setOfferedItem(item(200, requester, "available"));
        swapRequest.setStatus("pending");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(swapRequestRepository.findById(50))
                    .thenReturn(Optional.of(swapRequest));

            mockMvc.perform(delete("/api/swap-requests/50"))
                    .andExpect(status().isNoContent());
        }

        verify(swapRequestRepository).delete(swapRequest);
    }

    @Test
    void cancelSwapRequest_returns403_whenUserIsNotRequester() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "available"));
        swapRequest.setOfferedItem(item(200, requester, "available"));
        swapRequest.setStatus("pending");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            // The item owner tries to cancel someone else's request
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(owner);
            when(swapRequestRepository.findById(50))
                    .thenReturn(Optional.of(swapRequest));

            mockMvc.perform(delete("/api/swap-requests/50"))
                    .andExpect(status().isForbidden());
        }

        verify(swapRequestRepository, never()).delete(any(SwapRequest.class));
    }

    @Test
    void cancelSwapRequest_returns400_whenRequestIsNotPending() throws Exception {
        User requester = user(1, "requester");
        User owner = user(2, "owner");

        SwapRequest swapRequest = new SwapRequest();
        ReflectionTestUtils.setField(swapRequest, "id", 50);
        swapRequest.setRequester(requester);
        swapRequest.setOwner(owner);
        swapRequest.setRequestedItem(item(100, owner, "swapped"));
        swapRequest.setOfferedItem(item(200, requester, "swapped"));
        swapRequest.setStatus("accepted");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(swapRequestRepository.findById(50))
                    .thenReturn(Optional.of(swapRequest));

            mockMvc.perform(delete("/api/swap-requests/50"))
                    .andExpect(status().isBadRequest());
        }

        verify(swapRequestRepository, never()).delete(any(SwapRequest.class));
    }

    @Test
    void cancelSwapRequest_returns404_whenRequestDoesNotExist() throws Exception {
        User requester = user(1, "requester");

        try (MockedStatic<AuthUtils> mocked = mockStatic(AuthUtils.class)) {
            mocked.when(AuthUtils::getAuthenticatedUser).thenReturn(requester);
            when(swapRequestRepository.findById(999))
                    .thenReturn(Optional.empty());

            mockMvc.perform(delete("/api/swap-requests/999"))
                    .andExpect(status().isNotFound());
        }

        verify(swapRequestRepository, never()).delete(any(SwapRequest.class));
    }

}