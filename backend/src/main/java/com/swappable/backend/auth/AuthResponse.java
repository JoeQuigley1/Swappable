package com.swappable.backend.auth;

public record AuthResponse(
        Integer userId,
        String username,
        String email
) {
}