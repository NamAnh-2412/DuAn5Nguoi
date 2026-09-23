package duan5nguoi.booking;

import duan5nguoi.auth.AuthService;
import duan5nguoi.catalog.CatalogService;
import java.util.LinkedHashMap;
import java.util.Map;

public final class BookingService {
    private record Hold(long ownerId, String channel) {}

    private final CatalogService catalog;
    private final Map<String, Hold> seats = new LinkedHashMap<>();

    public BookingService(CatalogService catalog) {
        this.catalog = catalog;
    }

    public String hold(AuthService.Session session, long showtimeId, String seatCode, String channel) {
        if ("POS".equals(channel) && !"CASHIER".equals(session.role())) {
            throw new SecurityException("FORBIDDEN");
        }
        if ("ONLINE".equals(channel) && !"CUSTOMER".equals(session.role())) {
            throw new SecurityException("FORBIDDEN");
        }
        catalog.requireOnSale(showtimeId);
        String key = showtimeId + ":" + seatCode;
        Hold current = seats.get(key);
        if (current != null && current.ownerId != session.userId()) {
            throw new IllegalStateException("SEAT_TAKEN");
        }
        seats.put(key, new Hold(session.userId(), channel));
        return key;
    }

    public String confirm(AuthService.Session session, String holdKey) {
        Hold current = seats.get(holdKey);
        if (current == null || current.ownerId != session.userId()) {
            throw new IllegalStateException("HOLD_NOT_FOUND");
        }
        return "VX-" + holdKey + "-" + session.userId();
    }
}
