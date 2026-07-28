package com.swappable.backend.swaprequest;

import java.time.LocalDateTime;

public record SwapRequestResponse(
        Integer id,
        String requesterUsername,
        String ownerUsername,
        Integer requestedItemId,
        String requestedItemTitle,
        Integer offeredItemId,
        String offeredItemTitle,
        String status,
        String message,
        boolean requesterConfirmed,
        boolean ownerConfirmed,
        LocalDateTime completedAt,
        ContactDetails contactDetails
) {
}