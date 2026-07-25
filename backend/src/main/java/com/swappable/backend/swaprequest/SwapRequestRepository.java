package com.swappable.backend.swaprequest;

import com.swappable.backend.user.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Integer> {

    Page<SwapRequest> findByRequester(User requester, Pageable pageable);

    Page<SwapRequest> findByOwner(User owner, Pageable pageable);

    // locks the row so two simultaneous confirmations cannot lose each other's flag
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SwapRequest s where s.id = :id")
    Optional<SwapRequest> findByIdForUpdate(@Param("id") Integer id);

    @Transactional
    long deleteByStatusAndCreatedAtBefore(String status, LocalDateTime cutoff);

    boolean existsByRequesterIdAndRequestedItemIdAndOfferedItemIdAndStatus(
            Integer requesterId,
            Integer requestedItemId,
            Integer offeredItemId,
            String status
    );
}