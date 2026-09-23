package btl.vexemphim.booking.repository;

import btl.vexemphim.booking.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
            String status, LocalDateTime from, LocalDateTime to);
}
