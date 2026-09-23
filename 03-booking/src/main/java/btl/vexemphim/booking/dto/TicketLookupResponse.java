package btl.vexemphim.booking.dto;

import java.time.LocalDateTime;

public record TicketLookupResponse(
        Long reservationId,
        String ticketCode,
        String movieTitle,
        String roomName,
        LocalDateTime startAt,
        String seatLabel,
        String status,
        LocalDateTime checkedInAt
) {
}
