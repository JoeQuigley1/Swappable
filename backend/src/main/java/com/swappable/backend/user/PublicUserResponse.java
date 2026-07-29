package com.swappable.backend.user;

import com.swappable.backend.common.PagedResponse;
import com.swappable.backend.item.ItemResponse;

public record PublicUserResponse(
        Integer id,
        String username,
        String location,
        PagedResponse<ItemResponse> items
) {
}
