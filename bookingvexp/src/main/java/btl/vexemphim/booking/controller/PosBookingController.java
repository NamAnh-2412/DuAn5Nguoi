package btl.vexemphim.booking.controller;

import btl.vexemphim.booking.dto.CashConfirmRequest;
import btl.vexemphim.booking.dto.ReservationResponse;
import btl.vexemphim.booking.service.BookingService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pos/bookings")
public class PosBookingController {

    private final BookingService bookingService;

    public PosBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/{id}/confirm-cash")
    @PreAuthorize("hasRole('CASHIER')")
    public ReservationResponse confirmCash(@PathVariable Long id,
                                           @RequestBody(required = false) CashConfirmRequest body) {
        return bookingService.confirmCash(id);
    }
}
