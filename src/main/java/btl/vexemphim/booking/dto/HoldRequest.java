package btl.vexemphim.booking.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record HoldRequest(
        @NotNull Long showtimeId,
        @NotEmpty List<Long> seatIds,
        @NotNull String channel,
        String guestName
) {
}
