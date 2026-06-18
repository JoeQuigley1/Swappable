package com.swappable.backend.auth.dto;

public record LoginRequest(
        String email,
        String password
) {
}