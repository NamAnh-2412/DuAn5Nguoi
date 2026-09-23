package btl.vexemphim.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ReservationResponse(
        Long id,
        Long showtimeId,
        String status,
        String channel,
        String movieTitle,
        LocalDateTime startAt,
        String roomName,
        String guestName,
        BigDecimal seatsSubtotal,
        BigDecimal concessionsSubtotal,
        BigDecimal totalAmount,
        LocalDateTime holdExpiresAt,
        List<TicketDto> tickets,
        List<String> seatLabels,
        List<ConcessionDto> concessions
) {
    public record TicketDto(String ticketCode, String seatLabel, String qrPayload) {
    }

    public record ConcessionDto(Long productId, String name, BigDecimal unitPrice, int qty, BigDecimal lineTotal) {
    }
}
