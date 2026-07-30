package com.swappable.backend.stats;

import com.swappable.backend.item.ItemRepository;
import com.swappable.backend.swaprequest.SwapRequestRepository;
import com.swappable.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private ItemRepository itemRepository;
    @Mock private SwapRequestRepository swapRequestRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        StatsController controller = new StatsController(userRepository, itemRepository, swapRequestRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getStats_returnsCommunityCounters() throws Exception {
        when(userRepository.count()).thenReturn(42L);
        when(itemRepository.countByArchivedFalse()).thenReturn(17L);
        when(swapRequestRepository.countByStatus("completed")).thenReturn(5L);

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(42))
                .andExpect(jsonPath("$.itemCount").value(17))
                .andExpect(jsonPath("$.completedSwapCount").value(5));
    }

    @Test
    void getStats_countsOnlyCompletedSwaps() throws Exception {
        when(userRepository.count()).thenReturn(0L);
        when(itemRepository.countByArchivedFalse()).thenReturn(0L);
        when(swapRequestRepository.countByStatus("completed")).thenReturn(0L);

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedSwapCount").value(0));

        verify(swapRequestRepository).countByStatus("completed");
        verify(swapRequestRepository, never()).count();
    }

    @Test
    void getStats_excludesArchivedItems() throws Exception {
        when(userRepository.count()).thenReturn(3L);
        when(itemRepository.countByArchivedFalse()).thenReturn(2L);
        when(swapRequestRepository.countByStatus("completed")).thenReturn(1L);

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(2));

        verify(itemRepository).countByArchivedFalse();
        verify(itemRepository, never()).count();
    }
}
