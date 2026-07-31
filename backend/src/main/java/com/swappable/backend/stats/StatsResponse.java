package com.swappable.backend.stats;

public record StatsResponse(
        long memberCount,
        long itemCount,
        long completedSwapCount
) {
}
