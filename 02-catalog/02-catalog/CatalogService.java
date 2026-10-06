package duan5nguoi.catalog;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class CatalogService {
    public record Showtime(long id, long movieId, String room, LocalDateTime start, LocalDateTime end, String status) {}

    private final List<Showtime> showtimes = new ArrayList<>();
    private long seq = 1;

    public CatalogService() {
        LocalDate today = LocalDate.now();
        addShowtime(1, "Phong 1", today.atTime(19, 0), today.atTime(21, 0));
    }

    public Showtime addShowtime(long movieId, String room, LocalDateTime start, LocalDateTime end) {
        for (Showtime existing : showtimes) {
            boolean sameRoom = existing.room.equals(room) && "SCHEDULED".equals(existing.status);
            boolean overlap = start.isBefore(existing.end) && end.isAfter(existing.start);
            if (sameRoom && overlap) {
                throw new IllegalStateException("SHOWTIME_OVERLAP");
            }
        }
        Showtime created = new Showtime(seq++, movieId, room, start, end, "SCHEDULED");
        showtimes.add(created);
        return created;
    }

    public List<Showtime> listByMovie(long movieId) {
        return showtimes.stream().filter(item -> item.movieId == movieId).toList();
    }

    public Showtime requireOnSale(long showtimeId) {
        for (Showtime item : showtimes) {
            if (item.id == showtimeId && "SCHEDULED".equals(item.status)) {
                return item;
            }
        }
        throw new IllegalArgumentException("SHOWTIME_NOT_FOUND");
    }
}
