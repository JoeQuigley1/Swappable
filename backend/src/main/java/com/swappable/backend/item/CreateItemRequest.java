package com.swappable.backend.item;

public record CreateItemRequest(
        Integer userId,
        Integer categoryId,
        String title,
        String description,
        String condition,
        String imageUrl
) {
}