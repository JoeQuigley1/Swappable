package com.swappable.backend.item;

public record ItemResponse(
        Integer id,
        String title,
        String description,
        String condition,
        String imageUrl,
        String status,
        Integer categoryId,
        String categoryName,
        String ownerUsername,
        String ownerLocation,
        Double ownerLatitude,
        Double ownerLongitude
) {
}