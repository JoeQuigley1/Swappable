package com.swappable.backend.auth.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 50) String username,
        @Size(max = 100) String location,
        @Size(max = 30) String phoneNumber) {}