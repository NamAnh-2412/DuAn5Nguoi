package btl.vexemphim.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShowtimeResponse(
        Long id,
        Long movieId,
        String movieTitle,
        Long roomId,
        String roomName,
        LocalDateTime startAt,
        LocalDateTime endAt,
        BigDecimal basePrice,
        String status,
        Long hold,
        Long booked,
        Integer capacity
) {
}
