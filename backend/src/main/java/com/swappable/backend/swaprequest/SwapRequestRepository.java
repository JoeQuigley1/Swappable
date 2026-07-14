package com.swappable.backend.swaprequest;

import com.swappable.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;


public interface SwapRequestRepository extends JpaRepository<SwapRequest, Integer> {

    Page<SwapRequest> findByRequester(User requester, Pageable pageable);

    Page<SwapRequest> findByOwner(User owner, Pageable pageable);

    boolean existsByRequesterIdAndRequestedItemIdAndOfferedItemIdAndStatus(
            Integer requesterId,
            Integer requestedItemId,
            Integer offeredItemId,
            String status
    );
}