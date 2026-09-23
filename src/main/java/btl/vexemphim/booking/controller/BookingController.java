package btl.vexemphim.booking.controller;

import btl.vexemphim.booking.dto.*;
import btl.vexemphim.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Dịch vụ đặt chỗ / vé — nguồn sự thật ghế. */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/showtimes/{showtimeId}/seat-map")
    public SeatMapResponse seatMap(@PathVariable Long showtimeId) {
        return bookingService.seatMap(showtimeId);
    }

    @PostMapping("/hold")
    @PreAuthorize("hasAnyRole('CUSTOMER','CASHIER')")
    public ResponseEntity<HoldResponse> hold(@Valid @RequestBody HoldRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.hold(req));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ReservationResponse confirm(@PathVariable Long id, @RequestBody(required = false) ConfirmRequest req) {
        return bookingService.confirmOnline(id, req == null ? new ConfirmRequest("ONLINE_MOCK") : req);
    }

    @PutMapping("/{id}/concessions")
    @PreAuthorize("hasAnyRole('CUSTOMER','CASHIER')")
    public ReservationResponse concessions(@PathVariable Long id, @Valid @RequestBody ConcessionCartRequest req) {
        return bookingService.setConcessions(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','CASHIER','ADMIN')")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        bookingService.cancelHold(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<ReservationResponse> my() {
        return bookingService.myBookings();
    }

    @GetMapping("/{id}")
    public ReservationResponse one(@PathVariable Long id) {
        return bookingService.getOne(id);
    }

    @GetMapping("/occupancy")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public OccupancyResponse occupancy(@RequestParam Long showtimeId) {
        return bookingService.occupancy(showtimeId);
    }
}
