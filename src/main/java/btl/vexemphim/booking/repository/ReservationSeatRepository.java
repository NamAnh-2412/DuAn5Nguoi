package btl.vexemphim.booking.repository;

import btl.vexemphim.booking.entity.ReservationSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ReservationSeatRepository extends JpaRepository<ReservationSeat, Long> {

    List<ReservationSeat> findByShowtimeId(Long showtimeId);

    boolean existsByShowtimeIdAndSeatId(Long showtimeId, Long seatId);

    @Query("select count(rs) from ReservationSeat rs join rs.reservation r where rs.showtimeId = :sid and r.status = 'CONFIRMED'")
    long countBooked(@Param("sid") Long showtimeId);

    @Query("select count(rs) from ReservationSeat rs join rs.reservation r where rs.showtimeId = :sid and r.status = 'HOLD'")
    long countHold(@Param("sid") Long showtimeId);

    @Query("""
            select rs.showtimeId, count(rs) from ReservationSeat rs join rs.reservation r
            where rs.showtimeId in :ids and r.status = :status
            group by rs.showtimeId
            """)
    List<Object[]> countByShowtimeIdsAndStatus(
            @Param("ids") Collection<Long> ids,
            @Param("status") String status);
}
