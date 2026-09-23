package btl.vexemphim.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record HoldResponse(
        Long reservationId,
        String status,
        LocalDateTime holdExpiresAt,
        BigDecimal totalAmount,
        List<HeldSeat> seats
) {
    public record HeldSeat(Long seatId, String label, BigDecimal price) {
    }
}
