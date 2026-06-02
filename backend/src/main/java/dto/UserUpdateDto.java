package com.swappable.backend.dto;

public record UserUpdateDto(
        String bio,
        String location,
        String displayName
) {}