package com.swappable.backend.item;

public record CreateItemRequest(
        Integer categoryId,
        String title,
        String description,
        String condition,
        String imageUrl
) {
}