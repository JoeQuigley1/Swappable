package com.swappable.backend.auth.dto;

public record UpdateProfileRequest(
        String username,
        String location,
        String phoneNumber) {}