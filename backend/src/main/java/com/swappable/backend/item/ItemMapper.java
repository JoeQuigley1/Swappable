package com.swappable.backend.item;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

        return toResponse(item, imageUrls);
    }

    // maps a whole page at once, collecting every image id with a single query
    // instead of one query per item
    public List<ItemResponse> toResponses(List<Item> items) {
        if (items.isEmpty()) {
            return List.of();
        }

        List<Integer> itemIds = items.stream().map(Item::getId).toList();

        Map<Integer, List<String>> urlsByItemId = new HashMap<>();
        for (Object[] row : itemImageRepository.findIdsByItemIds(itemIds)) {
            Integer itemId = (Integer) row[0];
            Integer imageId = (Integer) row[1];
            urlsByItemId.computeIfAbsent(itemId, key -> new ArrayList<>()).add("/api/images/" + imageId);
        }

        return items.stream()
                .map(item -> toResponse(item, urlsByItemId.getOrDefault(item.getId(), List.of())))
                .toList();
    }

    private ItemResponse toResponse(Item item, List<String> imageUrls) {
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
