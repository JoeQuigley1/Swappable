package com.swappable.backend.swaprequest;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSwapRequest(
        @NotNull Integer requestedItemId,
        @NotNull Integer offeredItemId,
        @Size(max = 500, message = "Message exceeds character limit of 500")
        String message
) {
}