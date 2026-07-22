package com.swappable.backend.swaprequest;

import com.swappable.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Integer> {

    Page<SwapRequest> findByRequester(User requester, Pageable pageable);

    Page<SwapRequest> findByOwner(User owner, Pageable pageable);

    @Transactional
    long deleteByStatusAndCreatedAtBefore(String status, LocalDateTime cutoff);

    boolean existsByRequesterIdAndRequestedItemIdAndOfferedItemIdAndStatus(
            Integer requesterId,
            Integer requestedItemId,
            Integer offeredItemId,
            String status
    );
}