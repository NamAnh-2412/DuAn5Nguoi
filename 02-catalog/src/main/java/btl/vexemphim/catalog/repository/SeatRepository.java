package btl.vexemphim.catalog.repository;

import btl.vexemphim.catalog.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByRoom_IdOrderByRowLabelAscNumberAsc(Long roomId);
}
