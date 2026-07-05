package com.swappable.backend.item;

import java.time.LocalDateTime;
import java.util.List;

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
        Double ownerLongitude,
        List<String> imageUrls,
        LocalDateTime createdAt
) {
}
