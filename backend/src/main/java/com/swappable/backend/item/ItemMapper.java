package com.swappable.backend.item;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ItemMapper {

    private final ItemImageRepository itemImageRepository;

    public ItemMapper(ItemImageRepository itemImageRepository) {
        this.itemImageRepository = itemImageRepository;
    }

    public ItemResponse toResponse(Item item) {
        List<String> imageUrls = itemImageRepository.findIdsByItemId(item.getId())
                .stream()
                .map(imageId -> "/api/images/" + imageId)
                .toList();

        String cover = imageUrls.isEmpty() ? null : imageUrls.get(0);

        return new ItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getCondition(),
                cover,
                item.getStatus(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getUser().getId(),
                item.getUser().getUsername(),
                item.getUser().getLocation(),
                item.getUser().getLatitude(),
                item.getUser().getLongitude(),
                imageUrls,
                item.getCreatedAt()
        );
    }
}
