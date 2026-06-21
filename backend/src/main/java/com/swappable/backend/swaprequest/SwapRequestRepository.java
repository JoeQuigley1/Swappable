package com.swappable.backend.swaprequest;

import com.swappable.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Integer> {

    List<SwapRequest> findByRequester(User requester);

    List<SwapRequest> findByOwner(User owner);

    boolean existsByRequesterIdAndRequestedItemIdAndOfferedItemIdAndStatus(
            Integer requesterId,
            Integer requestedItemId,
            Integer offeredItemId,
            String status
    );
}