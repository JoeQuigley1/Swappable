package com.swappable.backend.auth.dto;

public record RegisterRequest(
        String username,
        String email,
        String password,
        String location,
        Double lat,
        Double lng
) {
}