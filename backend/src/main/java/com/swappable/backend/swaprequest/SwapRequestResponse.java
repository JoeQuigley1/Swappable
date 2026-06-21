package com.swappable.backend.swaprequest;

public record SwapRequestResponse(
        Integer id,
        String requesterUsername,
        String ownerUsername,
        Integer requestedItemId,
        String requestedItemTitle,
        Integer offeredItemId,
        String offeredItemTitle,
        String status,
        String message
) {
}