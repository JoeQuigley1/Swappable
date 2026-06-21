package com.swappable.backend.auth.dto;

public record AuthResponse(
        String token,
        Integer userId,
        String username,
        String email
) {
}