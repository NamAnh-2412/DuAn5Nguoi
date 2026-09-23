package btl.vexemphim.booking.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class HoldExpiryScheduler {

    private final BookingService bookingService;

    public HoldExpiryScheduler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedDelay = 30000)
    public void run() {
        bookingService.expireHolds();
    }
}
