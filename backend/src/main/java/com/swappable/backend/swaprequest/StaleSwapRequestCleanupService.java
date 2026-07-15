package com.swappable.backend.swaprequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class StaleSwapRequestCleanupService {

    private static final Logger log = LoggerFactory.getLogger(StaleSwapRequestCleanupService.class);
    private static final int STALE_AFTER_DAYS = 7;

    private final SwapRequestRepository swapRequestRepository;

    public StaleSwapRequestCleanupService(SwapRequestRepository swapRequestRepository) {
        this.swapRequestRepository = swapRequestRepository;
    }

    // runs once a day at 3am
    @Scheduled(cron = "0 0 3 * * *")
    public void deleteStaleRequests() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(STALE_AFTER_DAYS);
        long deleted = swapRequestRepository.deleteByStatusAndCreatedAtBefore("pending", cutoff);
        if (deleted > 0) {
            log.info("Deleted {} stale pending swap request(s) older than {} days", deleted, STALE_AFTER_DAYS);
        }
    }
}