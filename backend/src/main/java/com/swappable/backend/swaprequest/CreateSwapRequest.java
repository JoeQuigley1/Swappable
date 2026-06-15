package com.swappable.backend.swaprequest;

import jakarta.validation.constraints.NotNull;

public record CreateSwapRequest(
        @NotNull Integer requestedItemId,
        @NotNull Integer offeredItemId,
        String message
) {
}