package btl.vexemphim.booking.controller;

import btl.vexemphim.booking.dto.TicketLookupResponse;
import btl.vexemphim.booking.service.BookingService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final BookingService bookingService;

    public TicketController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/{ticketCode}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN')")
    public TicketLookupResponse lookup(@PathVariable String ticketCode) {
        return bookingService.lookupTicket(ticketCode);
    }

    @PostMapping("/{ticketCode}/check-in")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN')")
    public TicketLookupResponse checkIn(@PathVariable String ticketCode) {
        return bookingService.checkIn(ticketCode);
    }
}
