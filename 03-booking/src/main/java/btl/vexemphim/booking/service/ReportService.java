package btl.vexemphim.booking.service;

import btl.vexemphim.booking.dto.RevenueReportResponse;
import btl.vexemphim.booking.dto.RevenueReportResponse.Bucket;
import btl.vexemphim.booking.dto.RevenueReportResponse.ChannelSplit;
import btl.vexemphim.booking.dto.RevenueReportResponse.Money;
import btl.vexemphim.booking.dto.RevenueReportResponse.MovieStat;
import btl.vexemphim.booking.dto.RevenueReportResponse.ProductStat;
import btl.vexemphim.booking.dto.RevenueReportResponse.Range;
import btl.vexemphim.booking.entity.Payment;
import btl.vexemphim.booking.entity.Reservation;
import btl.vexemphim.booking.entity.ReservationConcession;
import btl.vexemphim.booking.repository.PaymentRepository;
import btl.vexemphim.booking.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;

    public ReportService(PaymentRepository paymentRepository, ReservationRepository reservationRepository) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
    }

    public RevenueReportResponse revenue(LocalDate from, LocalDate to, String grain) {
        LocalDate today = LocalDate.now();
        LocalDate rangeFrom = from == null ? today.withDayOfMonth(1) : from;
        LocalDate rangeTo = to == null ? today : to;
        if (rangeTo.isBefore(rangeFrom)) {
            LocalDate tmp = rangeFrom;
            rangeFrom = rangeTo;
            rangeTo = tmp;
        }
        String g = grain == null ? "DAY" : grain.trim().toUpperCase();
        if (!g.equals("DAY") && !g.equals("WEEK") && !g.equals("MONTH")) {
            g = "DAY";
        }

        Money todayM = moneyBetween(today, today);
        Money weekM = moneyBetween(today.with(DayOfWeek.MONDAY), today);
        Money monthM = moneyBetween(today.withDayOfMonth(1), today);
        List<PaidOrder> rangeOrders = ordersBetween(rangeFrom, rangeTo);
        Money rangeTotals = moneyOf(rangeOrders);
        List<Bucket> series = buckets(rangeFrom, rangeTo, g, rangeOrders);
        return new RevenueReportResponse(
                todayM,
                weekM,
                monthM,
                new Range(rangeFrom, rangeTo, g, rangeTotals),
                series,
                topMovies(rangeOrders),
                topConcessions(rangeOrders),
                new ChannelSplit(moneyOf(rangeOrders.stream().filter(o -> "ONLINE".equals(o.channel)).toList()),
                        moneyOf(rangeOrders.stream().filter(o -> "POS".equals(o.channel)).toList())));
    }

    private Money moneyBetween(LocalDate from, LocalDate to) {
        return moneyOf(ordersBetween(from, to));
    }

    private List<PaidOrder> ordersBetween(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<Payment> pays = paymentRepository.findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan("SUCCESS", start, end);
        if (pays.isEmpty()) {
            return List.of();
        }
        Map<Long, Payment> byRes = new HashMap<>();
        for (Payment p : pays) {
            byRes.put(p.getReservationId(), p);
        }
        List<Reservation> reservations = reservationRepository.findByIdIn(byRes.keySet());
        List<PaidOrder> out = new ArrayList<>();
        for (Reservation r : reservations) {
            Payment p = byRes.get(r.getId());
            if (p == null || p.getPaidAt() == null) {
                continue;
            }
            r.getSeats().size();
            r.getConcessions().size();
            BigDecimal ticket = r.getSeats().stream()
                    .map(s -> s.getPrice() == null ? BigDecimal.ZERO : s.getPrice())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal fnb = r.getConcessions().stream()
                    .map(ReservationConcession::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            out.add(new PaidOrder(p.getPaidAt().toLocalDate(), r.getChannel(), r.getMovieId(), r.getMovieTitle(),
                    ticket, fnb, r.getSeats().size(), r.getConcessions()));
        }
        return out;
    }

    private static Money moneyOf(List<PaidOrder> orders) {
        BigDecimal ticket = BigDecimal.ZERO;
        BigDecimal fnb = BigDecimal.ZERO;
        long seats = 0;
        for (PaidOrder o : orders) {
            ticket = ticket.add(o.ticket);
            fnb = fnb.add(o.fnb);
            seats += o.ticketsSold;
        }
        return new Money(ticket, fnb, ticket.add(fnb), seats);
    }

    private static List<Bucket> buckets(LocalDate from, LocalDate to, String grain, List<PaidOrder> orders) {
        Map<LocalDate, PaidOrder> acc = new HashMap<>();
        List<Bucket> list = new ArrayList<>();
        LocalDate cursor = bucketStart(from, grain);
        LocalDate last = bucketStart(to, grain);
        while (!cursor.isAfter(last)) {
            acc.put(cursor, new PaidOrder(cursor, null, null, null, BigDecimal.ZERO, BigDecimal.ZERO, 0, List.of()));
            cursor = nextBucket(cursor, grain);
        }
        Map<LocalDate, BigDecimal> ticket = new HashMap<>();
        Map<LocalDate, BigDecimal> fnb = new HashMap<>();
        for (PaidOrder o : orders) {
            LocalDate key = bucketStart(o.day, grain);
            ticket.merge(key, o.ticket, BigDecimal::add);
            fnb.merge(key, o.fnb, BigDecimal::add);
        }
        List<LocalDate> keys = new ArrayList<>(acc.keySet());
        keys.sort(Comparator.naturalOrder());
        for (LocalDate key : keys) {
            BigDecimal t = ticket.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal c = fnb.getOrDefault(key, BigDecimal.ZERO);
            list.add(new Bucket(labelOf(key, grain), key, t, c, t.add(c)));
        }
        return list;
    }

    private static LocalDate bucketStart(LocalDate d, String grain) {
        return switch (grain) {
            case "WEEK" -> d.with(DayOfWeek.MONDAY);
            case "MONTH" -> d.with(TemporalAdjusters.firstDayOfMonth());
            default -> d;
        };
    }

    private static LocalDate nextBucket(LocalDate d, String grain) {
        return switch (grain) {
            case "WEEK" -> d.plusWeeks(1);
            case "MONTH" -> d.plusMonths(1);
            default -> d.plusDays(1);
        };
    }

    private static String labelOf(LocalDate d, String grain) {
        return switch (grain) {
            case "WEEK" -> d.getDayOfMonth() + "/" + d.getMonthValue();
            case "MONTH" -> d.getMonthValue() + "/" + d.getYear();
            default -> d.getDayOfMonth() + "/" + d.getMonthValue();
        };
    }

    private static List<MovieStat> topMovies(List<PaidOrder> orders) {
        Map<String, MovieStat> map = new HashMap<>();
        for (PaidOrder o : orders) {
            String key = o.movieId + "|" + o.movieTitle;
            MovieStat cur = map.getOrDefault(key, new MovieStat(o.movieId, o.movieTitle == null ? "—" : o.movieTitle, 0, BigDecimal.ZERO));
            map.put(key, new MovieStat(cur.movieId(), cur.movieTitle(), cur.tickets() + o.ticketsSold, cur.revenue().add(o.ticket)));
        }
        return map.values().stream()
                .sorted(Comparator.comparingLong(MovieStat::tickets).reversed().thenComparing(MovieStat::revenue, Comparator.reverseOrder()))
                .limit(5)
                .toList();
    }

    private static List<ProductStat> topConcessions(List<PaidOrder> orders) {
        Map<String, ProductStat> map = new HashMap<>();
        for (PaidOrder o : orders) {
            for (ReservationConcession c : o.lines) {
                String key = c.getProductId() + "|" + c.getName();
                ProductStat cur = map.getOrDefault(key, new ProductStat(c.getProductId(), c.getName(), 0, BigDecimal.ZERO));
                map.put(key, new ProductStat(cur.productId(), cur.name(), cur.qty() + c.getQty(), cur.revenue().add(c.lineTotal())));
            }
        }
        return map.values().stream()
                .sorted(Comparator.comparingLong(ProductStat::qty).reversed().thenComparing(ProductStat::revenue, Comparator.reverseOrder()))
                .limit(5)
                .toList();
    }

    private record PaidOrder(LocalDate day, String channel, Long movieId, String movieTitle,
                             BigDecimal ticket, BigDecimal fnb, int ticketsSold,
                             List<ReservationConcession> lines) {
    }
}
