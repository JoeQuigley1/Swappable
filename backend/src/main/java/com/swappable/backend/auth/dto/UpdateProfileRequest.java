package com.swappable.backend.auth.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 50) String username,
        @Size(max = 100) String location,
        @Size(max = 30) String phoneNumber,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double lng) {}
