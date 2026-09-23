package btl.vexemphim.booking.repository;

import btl.vexemphim.booking.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByCustomerUserIdAndStatusOrderByCreatedAtDesc(Long customerUserId, String status);

    List<Reservation> findByStatusAndHoldExpiresAtBefore(String status, LocalDateTime now);

    List<Reservation> findByShowtimeIdAndCustomerUserIdAndStatus(Long showtimeId, Long customerUserId, String status);

    List<Reservation> findByShowtimeIdAndCashierUserIdAndStatus(Long showtimeId, Long cashierUserId, String status);

    List<Reservation> findByIdIn(Collection<Long> ids);
}
