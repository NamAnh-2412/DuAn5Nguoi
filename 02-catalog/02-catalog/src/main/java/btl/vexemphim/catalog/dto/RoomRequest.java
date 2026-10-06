package btl.vexemphim.catalog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomRequest(
        @NotBlank String name,
        @NotNull @Min(4) @Max(15) Integer rowCount,
        @NotNull @Min(6) @Max(16) Integer seatsPerRow,
        @NotNull @Min(0) @Max(15) Integer vipRowCount
) {
}
