package btl.vexemphim.catalog.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MovieRequest(
        @NotBlank @Size(max = 255) String title,
        @Min(1) int durationMinutes,
        String rated,
        String description,
        GenreRef genre,
        String status,
        String trailerUrl,
        @Size(max = 255) String director,
        @Size(max = 512) String castNames,
        LocalDate releaseDate
) {
    public record GenreRef(Long id) {
    }
}
