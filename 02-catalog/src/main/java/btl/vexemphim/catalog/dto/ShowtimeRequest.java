package btl.vexemphim.catalog.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShowtimeRequest(
        @NotNull Long movieId,
        @NotNull Long roomId,
        @NotNull LocalDateTime startAt,
        @NotNull BigDecimal basePrice
) {
}
