package com.swappable.backend.item;



import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateItemRequest(
        @NotNull Integer categoryId,
        @NotBlank String title,
        String description,
        @NotNull String condition
) {
}