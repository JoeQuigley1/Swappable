package com.swappable.backend.swaprequest;

public record SwapRequestResponse(
        Integer id,
        String requesterUsername,
        String ownerUsername,
        String requestedItemTitle,
        String offeredItemTitle,
        String status,
        String message
) {
}