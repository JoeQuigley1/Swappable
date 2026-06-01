package com.swappable.backend.auth;

public record AuthResponse(
        String token,
        Integer userId,
        String username,
        String email
) {
}