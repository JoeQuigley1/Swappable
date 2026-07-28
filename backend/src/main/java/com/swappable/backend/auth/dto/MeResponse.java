package com.swappable.backend.auth.dto;

public record MeResponse(
        Integer id,
        String username,
        String email,
        String location,
        String phoneNumber,
        Double lat,
        Double lng) {}