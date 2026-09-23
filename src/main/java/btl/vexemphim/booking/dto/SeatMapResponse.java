package btl.vexemphim.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SeatMapResponse(
        Long showtimeId,
        String movieTitle,
        LocalDateTime startAt,
        String roomName,
        int holdMinutes,
        List<SeatCell> seats
) {
    public record SeatCell(
            Long seatId,
            String label,
            String row,
            int number,
            String type,
            String status,
            BigDecimal price
    ) {
    }
}
