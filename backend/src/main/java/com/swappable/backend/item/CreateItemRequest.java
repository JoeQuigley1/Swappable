package com.swappable.backend.item;


import jakarta.validation.constraints.NotNull;

public record CreateItemRequest(
        @NotNull Integer categoryId,
        @NotNull String title,
        String description,
        @NotNull String condition,
        String imageUrl
) {
}