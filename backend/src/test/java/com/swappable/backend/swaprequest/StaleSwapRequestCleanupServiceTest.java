package com.swappable.backend.swaprequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaleSwapRequestCleanupServiceTest {

    @Mock private SwapRequestRepository swapRequestRepository;

    @Test
    void deletesPendingRequestsOlderThanSevenDays() {
        when(swapRequestRepository.deleteByStatusAndCreatedAtBefore(anyString(), any(LocalDateTime.class)))
                .thenReturn(3L);

        StaleSwapRequestCleanupService service = new StaleSwapRequestCleanupService(swapRequestRepository);
        service.deleteStaleRequests();

        ArgumentCaptor<String> statusCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<LocalDateTime> cutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

        verify(swapRequestRepository).deleteByStatusAndCreatedAtBefore(statusCaptor.capture(), cutoffCaptor.capture());

        // only pending requests should ever be targeted - accepted/declined/cancelled
        // requests are historical records and must never be auto-deleted
        assertEquals("pending", statusCaptor.getValue());

        // cutoff should be ~7 days before now. allow a small margin so the test
        // isn't flaky if it runs right on a day boundary
        LocalDateTime expectedCutoff = LocalDateTime.now().minusDays(7);
        long minutesDifference = Math.abs(Duration.between(expectedCutoff, cutoffCaptor.getValue()).toMinutes());
        assertTrue(minutesDifference < 1, "cutoff should be approximately 7 days before now");
    }
}