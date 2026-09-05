package com.crow5.portfolio.dto;

import jakarta.validation.constraints.NotBlank;

public record ProjectCreateRequest(
        @NotBlank String slug,
        @NotBlank String title,
        @NotBlank String summary,
        @NotBlank String background,
        @NotBlank String outcome,
        @NotBlank String role,
        String projectType
) {
}
