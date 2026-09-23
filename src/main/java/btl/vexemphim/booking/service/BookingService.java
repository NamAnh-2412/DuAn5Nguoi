package btl.vexemphim.booking.service;

import btl.vexemphim.booking.dto.*;
import btl.vexemphim.booking.entity.Payment;
import btl.vexemphim.booking.entity.Reservation;
import btl.vexemphim.booking.entity.ReservationConcession;
import btl.vexemphim.booking.entity.ReservationSeat;
import btl.vexemphim.booking.entity.Ticket;
import btl.vexemphim.booking.repository.PaymentRepository;
import btl.vexemphim.booking.repository.ReservationRepository;
import btl.vexemphim.booking.repository.ReservationSeatRepository;
import btl.vexemphim.booking.repository.TicketRepository;
import btl.vexemphim.catalog.entity.ConcessionProduct;
import btl.vexemphim.catalog.entity.Seat;
import btl.vexemphim.catalog.entity.Showtime;
import btl.vexemphim.catalog.repository.SeatRepository;
import btl.vexemphim.catalog.service.ConcessionService;
import btl.vexemphim.catalog.service.ShowtimeService;
import btl.vexemphim.common.exception.ApiException;
import btl.vexemphim.common.security.AuthContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class BookingService {

    private final ShowtimeService showtimeService;
    private final ConcessionService concessionService;
    private final SeatRepository seatRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationSeatRepository reservationSeatRepository;
    private final TicketRepository ticketRepository;
    private final PaymentRepository paymentRepository;
    private final int holdMinutes;
    private final BigDecimal vipMultiplier;

    @PersistenceContext
    private EntityManager em;

    public BookingService(ShowtimeService showtimeService,
                          ConcessionService concessionService,
                          SeatRepository seatRepository,
                          ReservationRepository reservationRepository,
                          ReservationSeatRepository reservationSeatRepository,
                          TicketRepository ticketRepository,
                          PaymentRepository paymentRepository,
                          @Value("${app.hold-minutes:8}") int holdMinutes,
                          @Value("${app.vip-multiplier:1.2}") BigDecimal vipMultiplier) {
        this.showtimeService = showtimeService;
        this.concessionService = concessionService;
        this.seatRepository = seatRepository;
        this.reservationRepository = reservationRepository;
        this.reservationSeatRepository = reservationSeatRepository;
        this.ticketRepository = ticketRepository;
        this.paymentRepository = paymentRepository;
        this.holdMinutes = holdMinutes;
        this.vipMultiplier = vipMultiplier;
    }

    public SeatMapResponse seatMap(Long showtimeId) {
        Showtime st = showtimeService.get(showtimeId);
        Long me = AuthContext.userId();
        Map<Long, ReservationSeat> taken = new HashMap<>();
        for (ReservationSeat rs : reservationSeatRepository.findByShowtimeId(showtimeId)) {
            taken.put(rs.getSeatId(), rs);
        }
        List<Seat> seats = seatRepository.findByRoom_IdOrderByRowLabelAscNumberAsc(st.getRoom().getId());
        List<SeatMapResponse.SeatCell> cells = new ArrayList<>();
        for (Seat seat : seats) {
            BigDecimal price = priceOf(st, seat);
            String status = "AVAILABLE";
            ReservationSeat rs = taken.get(seat.getId());
            if (rs != null) {
                Reservation r = rs.getReservation();
                if ("CONFIRMED".equals(r.getStatus())) {
                    status = "BOOKED";
                } else if ("HOLD".equals(r.getStatus())) {
                    boolean mine = ("POS".equals(r.getChannel()) && me != null && me.equals(r.getCashierUserId()))
                            || ("ONLINE".equals(r.getChannel()) && me != null && me.equals(r.getCustomerUserId()));
                    status = mine ? "HOLD_MINE" : "HOLD";
                }
            }
            cells.add(new SeatMapResponse.SeatCell(
                    seat.getId(), seat.label(), seat.getRowLabel(), seat.getNumber(),
                    seat.getType(), status, price));
        }
        return new SeatMapResponse(st.getId(), st.getMovie().getTitle(), st.getStartAt(),
                st.getRoom().getName(), holdMinutes, cells);
    }

    @Transactional
    public HoldResponse hold(HoldRequest req) {
        String role = AuthContext.role();
        Long userId = AuthContext.userId();
        if (req.seatIds().size() > 8) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Tối đa 8 ghế / lần giữ");
        }
        if ("ONLINE".equals(req.channel()) && !"CUSTOMER".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "CUSTOMER mới hold ONLINE");
        }
        if ("POS".equals(req.channel()) && !"CASHIER".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "CASHIER mới hold POS");
        }
        Showtime st = showtimeService.get(req.showtimeId());
        em.lock(st, LockModeType.PESSIMISTIC_WRITE);
        LocalDateTime now = LocalDateTime.now();
        if (!"SCHEDULED".equals(st.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Suất không còn mở bán");
        }
        boolean posWalkIn = "POS".equals(req.channel()) && "CASHIER".equals(role);
        if (posWalkIn) {
            if (st.getEndAt() != null && !st.getEndAt().isAfter(now)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Suất đã kết thúc");
            }
        } else if (!st.getStartAt().isAfter(now)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Suất không còn mở bán");
        }
        if (!"ACTIVE".equals(st.getRoom().getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROOM_INACTIVE", "Phòng đang dừng, không bán vé suất này");
        }
        if ("COMING".equals(st.getMovie().getStatus()) || "HIDDEN".equals(st.getMovie().getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MOVIE_NOT_ON_SALE", "Phim chưa mở bán vé");
        }
        Reservation mine = findMyOpenHold(st.getId(), userId, req.channel());
        try {
            if (mine != null) {
                return replaceHoldSeats(mine, st, req, now);
            }
            return createHold(st, req, userId, now);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT, "SEAT_TAKEN", "Ghế đã được giữ hoặc bán");
        }
    }

    @Transactional
    public ReservationResponse setConcessions(Long id, ConcessionCartRequest req) {
        Reservation res = get(id);
        assertHoldOwner(res);
        assertHoldOpen(res);
        res.getConcessions().clear();
        List<ConcessionCartRequest.Line> items = req.items() == null ? List.of() : req.items();
        for (ConcessionCartRequest.Line line : items) {
            if (line.qty() == null || line.qty() <= 0) {
                continue;
            }
            ConcessionProduct p = concessionService.get(line.productId());
            if (!"ACTIVE".equals(p.getStatus())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "CONCESSION_HIDDEN", "Món đã ngừng bán");
            }
            ReservationConcession row = new ReservationConcession();
            row.setReservation(res);
            row.setProductId(p.getId());
            row.setName(p.getName());
            row.setUnitPrice(p.getPrice());
            row.setQty(line.qty());
            res.getConcessions().add(row);
        }
        recalcTotal(res);
        return toResponse(res);
    }

    @Transactional
    public ReservationResponse confirmOnline(Long id, ConfirmRequest req) {
        Reservation res = get(id);
        Long userId = AuthContext.userId();
        if (!"CUSTOMER".equals(AuthContext.role()) || !userId.equals(res.getCustomerUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không phải chủ giữ chỗ");
        }
        if (!"ONLINE".equals(res.getChannel())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Sai kênh");
        }
        return finalizePayment(res, req == null || req.paymentMethod() == null ? "ONLINE_MOCK" : req.paymentMethod());
    }

    @Transactional
    public ReservationResponse confirmCash(Long id) {
        Reservation res = get(id);
        Long userId = AuthContext.userId();
        if (!"CASHIER".equals(AuthContext.role()) || !userId.equals(res.getCashierUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không phải thu ngân của hold này");
        }
        if (!"POS".equals(res.getChannel())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Sai kênh");
        }
        return finalizePayment(res, "CASH");
    }

    @Transactional
    public void cancelHold(Long id) {
        Reservation res = get(id);
        Long userId = AuthContext.userId();
        String role = AuthContext.role();
        boolean owner = ("CUSTOMER".equals(role) && userId.equals(res.getCustomerUserId()))
                || ("CASHIER".equals(role) && userId.equals(res.getCashierUserId()))
                || "ADMIN".equals(role);
        if (!owner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không hủy được hold này");
        }
        if (!"HOLD".equals(res.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Chỉ hủy khi đang HOLD");
        }
        expire(res, "CANCELLED");
    }

    public List<ReservationResponse> myBookings() {
        Long userId = AuthContext.userId();
        return reservationRepository.findByCustomerUserIdAndStatusOrderByCreatedAtDesc(userId, "CONFIRMED")
                .stream().map(this::toResponse).toList();
    }

    public ReservationResponse getOne(Long id) {
        Reservation res = get(id);
        Long userId = AuthContext.userId();
        String role = AuthContext.role();
        boolean owner = userId != null && (userId.equals(res.getCustomerUserId()) || userId.equals(res.getCashierUserId()));
        boolean cashierReprint = "CASHIER".equals(role) && "CONFIRMED".equals(res.getStatus());
        boolean ok = "ADMIN".equals(role) || owner || cashierReprint;
        if (!ok) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không xem được vé người khác");
        }
        return toResponse(res);
    }

    public OccupancyResponse occupancy(Long showtimeId) {
        return new OccupancyResponse(
                reservationSeatRepository.countHold(showtimeId),
                reservationSeatRepository.countBooked(showtimeId));
    }

    public TicketLookupResponse lookupTicket(String code) {
        return toLookup(ticketByCode(code));
    }

    @Transactional
    public TicketLookupResponse checkIn(String code) {
        Ticket t = ticketByCode(code);
        Reservation r = t.getReservation();
        if (!"CONFIRMED".equals(r.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NOT_PAID", "Vé chưa thanh toán");
        }
        if ("CHECKED_IN".equals(ticketStatus(t))) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_CHECKED_IN", "Vé đã soát");
        }
        t.setStatus("CHECKED_IN");
        t.setCheckedInAt(LocalDateTime.now());
        return toLookup(t);
    }

    @Transactional
    public void expireHolds() {
        List<Reservation> expired = reservationRepository.findByStatusAndHoldExpiresAtBefore("HOLD", LocalDateTime.now());
        for (Reservation r : expired) {
            expire(r, "EXPIRED");
        }
    }

    private ReservationResponse finalizePayment(Reservation res, String method) {
        if ("CONFIRMED".equals(res.getStatus())) {
            return toResponse(res);
        }
        if (!"HOLD".equals(res.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "HOLD_EXPIRED", "Giữ chỗ không còn hiệu lực");
        }
        if (res.getHoldExpiresAt() != null && res.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
            expire(res, "EXPIRED");
            throw new ApiException(HttpStatus.CONFLICT, "HOLD_EXPIRED", "Hết thời gian giữ ghế");
        }
        assertShowtimeSellable(res);
        res.setStatus("CONFIRMED");
        res.setHoldExpiresAt(null);
        Payment p = new Payment();
        p.setReservationId(res.getId());
        p.setMethod(method);
        p.setStatus("SUCCESS");
        p.setAmount(res.getTotalAmount());
        p.setPaidAt(LocalDateTime.now());
        paymentRepository.save(p);
        int i = 1;
        for (ReservationSeat seat : res.getSeats()) {
            Ticket t = new Ticket();
            t.setReservation(res);
            String code = String.format("VX-%d-%06d", LocalDateTime.now().getYear(), res.getId() * 10 + i);
            t.setTicketCode(code);
            t.setQrPayload(code + "|" + seat.getSeatLabel());
            t.setStatus("ISSUED");
            res.getTickets().add(t);
            i++;
        }
        return toResponse(res);
    }

    private void expire(Reservation res, String status) {
        res.getSeats().clear();
        res.getConcessions().clear();
        res.setStatus(status);
    }

    private void assertHoldOwner(Reservation res) {
        Long userId = AuthContext.userId();
        String role = AuthContext.role();
        boolean owner = ("CUSTOMER".equals(role) && userId.equals(res.getCustomerUserId()))
                || ("CASHIER".equals(role) && userId.equals(res.getCashierUserId()));
        if (!owner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không sửa đồ ăn vặt của giữ chỗ này");
        }
    }

    private void assertHoldOpen(Reservation res) {
        if (!"HOLD".equals(res.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Chỉ thêm đồ ăn vặt khi đang giữ ghế");
        }
        if (res.getHoldExpiresAt() != null && res.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
            expire(res, "EXPIRED");
            throw new ApiException(HttpStatus.CONFLICT, "HOLD_EXPIRED", "Hết thời gian giữ ghế");
        }
    }

    private void recalcTotal(Reservation res) {
        res.setTotalAmount(seatsSubtotal(res).add(concessionsSubtotal(res)));
    }

    private static BigDecimal seatsSubtotal(Reservation r) {
        return r.getSeats().stream()
                .map(s -> s.getPrice() == null ? BigDecimal.ZERO : s.getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal concessionsSubtotal(Reservation r) {
        return r.getConcessions().stream()
                .map(ReservationConcession::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Reservation findMyOpenHold(Long showtimeId, Long userId, String channel) {
        List<Reservation> old = "POS".equals(channel)
                ? reservationRepository.findByShowtimeIdAndCashierUserIdAndStatus(showtimeId, userId, "HOLD")
                : reservationRepository.findByShowtimeIdAndCustomerUserIdAndStatus(showtimeId, userId, "HOLD");
        Reservation open = null;
        LocalDateTime now = LocalDateTime.now();
        for (Reservation r : old) {
            if (r.getHoldExpiresAt() != null && r.getHoldExpiresAt().isBefore(now)) {
                expire(r, "EXPIRED");
            } else if (open == null) {
                open = r;
            } else {
                expire(r, "CANCELLED");
            }
        }
        reservationRepository.flush();
        return open;
    }

    private HoldResponse replaceHoldSeats(Reservation mine, Showtime st, HoldRequest req, LocalDateTime now) {
        Set<Long> wanted = new LinkedHashSet<>(req.seatIds());
        mine.getSeats().removeIf(rs -> !wanted.contains(rs.getSeatId()));
        reservationRepository.flush();
        Set<Long> have = new HashSet<>();
        for (ReservationSeat rs : mine.getSeats()) {
            have.add(rs.getSeatId());
        }
        for (Long seatId : wanted) {
            if (have.contains(seatId)) {
                continue;
            }
            attachSeat(mine, st, seatId);
        }
        mine.setGuestName(req.guestName());
        if (mine.getHoldExpiresAt() == null) {
            mine.setHoldExpiresAt(now.plusMinutes(holdMinutes));
        }
        recalcTotal(mine);
        reservationRepository.saveAndFlush(mine);
        return toHoldResponse(mine);
    }

    private HoldResponse createHold(Showtime st, HoldRequest req, Long userId, LocalDateTime now) {
        Reservation res = new Reservation();
        res.setShowtimeId(st.getId());
        res.setMovieId(st.getMovie().getId());
        res.setMovieTitle(st.getMovie().getTitle());
        res.setStartAt(st.getStartAt());
        res.setRoomName(st.getRoom().getName());
        res.setChannel(req.channel());
        res.setGuestName(req.guestName());
        res.setStatus("HOLD");
        res.setHoldExpiresAt(now.plusMinutes(holdMinutes));
        if ("ONLINE".equals(req.channel())) {
            res.setCustomerUserId(userId);
        } else {
            res.setCashierUserId(userId);
        }
        for (Long seatId : req.seatIds()) {
            attachSeat(res, st, seatId);
        }
        recalcTotal(res);
        reservationRepository.saveAndFlush(res);
        return toHoldResponse(res);
    }

    private void attachSeat(Reservation res, Showtime st, Long seatId) {
        if (reservationSeatRepository.existsByShowtimeIdAndSeatId(st.getId(), seatId)) {
            throw new ApiException(HttpStatus.CONFLICT, "SEAT_TAKEN", "Ghế đã được giữ hoặc bán");
        }
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Ghế không tồn tại"));
        if (!seat.getRoom().getId().equals(st.getRoom().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Ghế không thuộc phòng suất này");
        }
        ReservationSeat rs = new ReservationSeat();
        rs.setReservation(res);
        rs.setShowtimeId(st.getId());
        rs.setSeatId(seatId);
        rs.setSeatLabel(seat.label());
        rs.setPrice(priceOf(st, seat));
        res.getSeats().add(rs);
    }

    private HoldResponse toHoldResponse(Reservation res) {
        List<HoldResponse.HeldSeat> held = res.getSeats().stream()
                .map(s -> new HoldResponse.HeldSeat(s.getSeatId(), s.getSeatLabel(), s.getPrice()))
                .toList();
        return new HoldResponse(res.getId(), res.getStatus(), res.getHoldExpiresAt(), res.getTotalAmount(), held);
    }

    private void assertShowtimeSellable(Reservation res) {
        Showtime st = showtimeService.get(res.getShowtimeId());
        LocalDateTime now = LocalDateTime.now();
        if (!"SCHEDULED".equals(st.getStatus())) {
            expire(res, "EXPIRED");
            throw new ApiException(HttpStatus.CONFLICT, "SHOWTIME_CLOSED", "Suất không còn mở bán");
        }
        if ("POS".equals(res.getChannel()) && st.getEndAt() != null && !st.getEndAt().isAfter(now)) {
            expire(res, "EXPIRED");
            throw new ApiException(HttpStatus.CONFLICT, "SHOWTIME_ENDED", "Suất đã kết thúc");
        }
    }

    private Reservation get(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy đặt chỗ"));
    }

    private BigDecimal priceOf(Showtime st, Seat seat) {
        BigDecimal base = st.getBasePrice();
        if ("VIP".equalsIgnoreCase(seat.getType())) {
            return base.multiply(vipMultiplier).setScale(0, RoundingMode.HALF_UP);
        }
        return base;
    }

    private ReservationResponse toResponse(Reservation r) {
        List<ReservationResponse.TicketDto> tickets = r.getTickets().stream()
                .map(t -> new ReservationResponse.TicketDto(t.getTicketCode(),
                        seatFromTicket(t, r), t.getQrPayload()))
                .toList();
        List<String> labels = r.getSeats().stream().map(ReservationSeat::getSeatLabel).toList();
        List<ReservationResponse.ConcessionDto> concessions = r.getConcessions().stream()
                .map(c -> new ReservationResponse.ConcessionDto(
                        c.getProductId(), c.getName(), c.getUnitPrice(), c.getQty(), c.lineTotal()))
                .toList();
        BigDecimal seats = seatsSubtotal(r);
        BigDecimal fnb = concessionsSubtotal(r);
        return new ReservationResponse(r.getId(), r.getShowtimeId(), r.getStatus(), r.getChannel(), r.getMovieTitle(),
                r.getStartAt(), r.getRoomName(), r.getGuestName(), seats, fnb, r.getTotalAmount(),
                r.getHoldExpiresAt(), tickets, labels, concessions);
    }

    private Ticket ticketByCode(String code) {
        return ticketRepository.findByTicketCode(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không có mã vé"));
    }

    private static String ticketStatus(Ticket t) {
        return t.getStatus() == null || t.getStatus().isBlank() ? "ISSUED" : t.getStatus();
    }

    private TicketLookupResponse toLookup(Ticket t) {
        Reservation r = t.getReservation();
        return new TicketLookupResponse(
                r.getId(),
                t.getTicketCode(),
                r.getMovieTitle(),
                r.getRoomName(),
                r.getStartAt(),
                seatFromTicket(t, r),
                ticketStatus(t),
                t.getCheckedInAt());
    }

    private String seatFromTicket(Ticket t, Reservation r) {
        if (t.getQrPayload() != null && t.getQrPayload().contains("|")) {
            return t.getQrPayload().substring(t.getQrPayload().indexOf('|') + 1);
        }
        return r.getSeats().isEmpty() ? "" : r.getSeats().get(0).getSeatLabel();
    }
}
