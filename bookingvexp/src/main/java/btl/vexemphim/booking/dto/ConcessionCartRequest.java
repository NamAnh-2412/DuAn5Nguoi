package btl.vexemphim.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ConcessionCartRequest(
        @NotNull @Size(max = 10) @Valid List<Line> items
) {
    public record Line(
            @NotNull Long productId,
            @NotNull @Min(0) @Max(8) Integer qty
    ) {
    }
}
