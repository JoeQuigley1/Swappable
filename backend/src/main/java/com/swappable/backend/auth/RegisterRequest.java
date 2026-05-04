package com.swappable.backend.auth;

public record RegisterRequest(
        String username,
        String email,
        String password,
        String location
) {
}