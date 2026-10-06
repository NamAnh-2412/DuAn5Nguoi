package btl.vexemphim.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record CinemaSettingsRequest(@NotBlank String name) {
}
