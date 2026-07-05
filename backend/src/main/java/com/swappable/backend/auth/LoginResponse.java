package com.swappable.backend.auth;

public record LoginResponse(
        String token,
        Integer userId,
        String username,
        String email,
        boolean requires2FA,
        String tempToken
) {
}
