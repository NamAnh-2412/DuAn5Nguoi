package btl.vexemphim.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RevenueReportResponse(
        Money today,
        Money week,
        Money month,
        Range range,
        List<Bucket> series,
        List<MovieStat> topMovies,
        List<ProductStat> topConcessions,
        ChannelSplit byChannel
) {
    public record Money(BigDecimal ticket, BigDecimal concession, BigDecimal total, long ticketsSold) {
    }

    public record Range(LocalDate from, LocalDate to, String grain, Money totals) {
    }

    public record Bucket(String label, LocalDate date, BigDecimal ticket, BigDecimal concession, BigDecimal total) {
    }

    public record MovieStat(Long movieId, String movieTitle, long tickets, BigDecimal revenue) {
    }

    public record ProductStat(Long productId, String name, long qty, BigDecimal revenue) {
    }

    public record ChannelSplit(Money online, Money pos) {
    }
}
