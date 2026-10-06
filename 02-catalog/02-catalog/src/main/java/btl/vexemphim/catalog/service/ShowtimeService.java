package btl.vexemphim.catalog.service;

import btl.vexemphim.booking.repository.ReservationSeatRepository;
import btl.vexemphim.catalog.dto.ShowtimeRequest;
import btl.vexemphim.catalog.dto.ShowtimeResponse;
import btl.vexemphim.catalog.entity.Movie;
import btl.vexemphim.catalog.entity.Room;
import btl.vexemphim.catalog.entity.Showtime;
import btl.vexemphim.catalog.repository.MovieRepository;
import btl.vexemphim.catalog.repository.RoomRepository;
import btl.vexemphim.catalog.repository.ShowtimeRepository;
import btl.vexemphim.common.exception.ApiException;
import btl.vexemphim.common.security.AuthContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final RoomRepository roomRepository;
    private final ReservationSeatRepository reservationSeatRepository;

    public ShowtimeService(ShowtimeRepository showtimeRepository,
                           MovieRepository movieRepository,
                           RoomRepository roomRepository,
                           ReservationSeatRepository reservationSeatRepository) {
        this.showtimeRepository = showtimeRepository;
        this.movieRepository = movieRepository;
        this.roomRepository = roomRepository;
        this.reservationSeatRepository = reservationSeatRepository;
    }

    public ShowtimeResponse toResponse(Showtime s) {
        return toResponse(s, null, null);
    }

    public ShowtimeResponse toResponse(Showtime s, Long hold, Long booked) {
        Room room = s.getRoom();
        int capacity = room.getRowCount() * room.getSeatsPerRow();
        return new ShowtimeResponse(
                s.getId(),
                s.getMovie().getId(),
                s.getMovie().getTitle(),
                room.getId(),
                room.getName(),
                s.getStartAt(),
                s.getEndAt(),
                s.getBasePrice(),
                s.getStatus(),
                hold,
                booked,
                capacity);
    }

    public List<ShowtimeResponse> list(Long movieId, LocalDate date, boolean includePast) {
        String role = AuthContext.role();
        boolean admin = "ADMIN".equals(role);
        boolean cashier = "CASHIER".equals(role);
        boolean past = includePast && admin;
        LocalDate d = date == null ? LocalDate.now() : date;
        LocalDateTime from = d.atStartOfDay();
        LocalDateTime to = d.atTime(LocalTime.MAX);
        LocalDateTime now = LocalDateTime.now();
        List<Showtime> list = movieId == null
                ? showtimeRepository.findByStatusAndStartAtBetweenOrderByStartAtAsc("SCHEDULED", from, to)
                : showtimeRepository.findByMovie_IdAndStatusAndStartAtBetweenOrderByStartAtAsc(movieId, "SCHEDULED", from, to);
        List<Showtime> visible = list.stream()
                .filter(s -> {
                    if (past) {
                        return true;
                    }
                    if (cashier) {
                        return s.getEndAt() == null || s.getEndAt().isAfter(now);
                    }
                    return s.getStartAt().isAfter(now);
                })
                .filter(s -> admin || "ACTIVE".equals(s.getRoom().getStatus()))
                .toList();
        if ((!admin && !cashier) || visible.isEmpty()) {
            return visible.stream().map(s -> toResponse(s, null, null)).toList();
        }
        List<Long> ids = visible.stream().map(Showtime::getId).toList();
        Map<Long, Long> holds = countsByStatus(ids, "HOLD");
        Map<Long, Long> booked = countsByStatus(ids, "CONFIRMED");
        return visible.stream()
                .map(s -> toResponse(s, holds.getOrDefault(s.getId(), 0L), booked.getOrDefault(s.getId(), 0L)))
                .toList();
    }

    public ShowtimeResponse getResponse(Long id) {
        Showtime s = get(id);
        if (!"ADMIN".equals(AuthContext.role())) {
            return toResponse(s, null, null);
        }
        return toResponse(s, reservationSeatRepository.countHold(id), reservationSeatRepository.countBooked(id));
    }

    public Showtime get(Long id) {
        return showtimeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy suất"));
    }

    @Transactional
    public ShowtimeResponse create(ShowtimeRequest req) {
        Movie movie = movieRepository.findById(req.movieId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Phim không tồn tại"));
        assertMovieOnSale(movie);
        Room room = roomRepository.findById(req.roomId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Phòng không tồn tại"));
        assertRoomActive(room);
        assertStartInFuture(req.startAt());
        LocalDateTime endAt = req.startAt().plusMinutes(movie.getDurationMinutes() + 15);
        assertNoOverlap(room.getId(), req.startAt(), endAt, -1L);
        Showtime s = new Showtime();
        s.setMovie(movie);
        s.setRoom(room);
        s.setStartAt(req.startAt());
        s.setEndAt(endAt);
        s.setBasePrice(req.basePrice());
        s.setStatus("SCHEDULED");
        showtimeRepository.save(s);
        return toResponse(s, 0L, 0L);
    }

    @Transactional
    public ShowtimeResponse update(Long id, ShowtimeRequest req) {
        Showtime s = get(id);
        assertNoOccupiedSeats(id, "sửa");
        Movie movie = movieRepository.findById(req.movieId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Phim không tồn tại"));
        assertMovieOnSale(movie);
        Room room = roomRepository.findById(req.roomId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Phòng không tồn tại"));
        assertRoomActive(room);
        assertStartInFuture(req.startAt());
        LocalDateTime endAt = req.startAt().plusMinutes(movie.getDurationMinutes() + 15);
        assertNoOverlap(room.getId(), req.startAt(), endAt, id);
        s.setMovie(movie);
        s.setRoom(room);
        s.setStartAt(req.startAt());
        s.setEndAt(endAt);
        s.setBasePrice(req.basePrice());
        return toResponse(s, reservationSeatRepository.countHold(id), 0L);
    }

    @Transactional
    public void cancel(Long id) {
        assertNoOccupiedSeats(id, "hủy");
        Showtime s = get(id);
        s.setStatus("CANCELLED");
    }

    private Map<Long, Long> countsByStatus(List<Long> ids, String status) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : reservationSeatRepository.countByShowtimeIdsAndStatus(ids, status)) {
            map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return map;
    }

    private void assertNoOccupiedSeats(Long showtimeId, String action) {
        if (reservationSeatRepository.countBooked(showtimeId) > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "HAS_TICKETS", "Suất đã bán, không " + action);
        }
        if (reservationSeatRepository.countHold(showtimeId) > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "HAS_HOLDS", "Suất đang có ghế giữ, không " + action);
        }
    }

    private static void assertMovieOnSale(Movie movie) {
        if ("COMING".equals(movie.getStatus()) || "HIDDEN".equals(movie.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MOVIE_NOT_ON_SALE", "Phim chưa mở bán vé");
        }
    }

    private static void assertStartInFuture(LocalDateTime startAt) {
        if (startAt == null || !startAt.isAfter(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SHOWTIME_PAST", "Giờ bắt đầu phải ở tương lai");
        }
    }

    private static void assertRoomActive(Room room) {
        if (!"ACTIVE".equals(room.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROOM_INACTIVE", "Phòng đang dừng, không tạo/sửa suất");
        }
    }

    private void assertNoOverlap(Long roomId, LocalDateTime start, LocalDateTime end, Long excludeId) {
        if (!showtimeRepository.findOverlaps(roomId, start, end, excludeId == null ? -1L : excludeId).isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "SHOWTIME_OVERLAP", "Suất chồng giờ trong cùng phòng");
        }
    }
}
