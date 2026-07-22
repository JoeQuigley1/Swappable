package com.swappable.backend.user;

import com.swappable.backend.item.ItemResponse;

import java.util.List;

public record PublicUserResponse(
        Integer id,
        String username,
        String location,
        List<ItemResponse> items
) {
}
