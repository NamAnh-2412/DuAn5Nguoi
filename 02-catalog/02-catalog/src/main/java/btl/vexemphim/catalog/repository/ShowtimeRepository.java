package btl.vexemphim.catalog.repository;

import btl.vexemphim.catalog.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByMovie_IdAndStatusAndStartAtBetweenOrderByStartAtAsc(
            Long movieId, String status, LocalDateTime from, LocalDateTime to);

    List<Showtime> findByStatusAndStartAtBetweenOrderByStartAtAsc(
            String status, LocalDateTime from, LocalDateTime to);

    @Query("""
            select s from Showtime s
            where s.room.id = :roomId and s.status = 'SCHEDULED'
              and s.id <> :excludeId
              and s.startAt < :endAt and s.endAt > :startAt
            """)
    List<Showtime> findOverlaps(
            @Param("roomId") Long roomId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("excludeId") Long excludeId);
}
