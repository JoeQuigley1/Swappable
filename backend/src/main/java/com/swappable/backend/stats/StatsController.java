package com.swappable.backend.stats;

import com.swappable.backend.item.ItemRepository;
import com.swappable.backend.swaprequest.SwapRequestRepository;
import com.swappable.backend.user.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private static final String STATUS_COMPLETED = "completed";

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final SwapRequestRepository swapRequestRepository;

    public StatsController(
            UserRepository userRepository,
            ItemRepository itemRepository,
            SwapRequestRepository swapRequestRepository
    ) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.swapRequestRepository = swapRequestRepository;
    }

    // public community counters for the home page hero
    @GetMapping
    public StatsResponse getStats() {
        return new StatsResponse(
                userRepository.count(),
                // archived items are hidden from the listings, so they are not counted here either
                itemRepository.countByArchivedFalse(),
                swapRequestRepository.countByStatus(STATUS_COMPLETED)
        );
    }
}
