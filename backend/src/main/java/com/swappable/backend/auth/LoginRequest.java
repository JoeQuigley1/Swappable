package com.swappable.backend.auth;

public record LoginRequest(
        String email,
        String password
) {
}