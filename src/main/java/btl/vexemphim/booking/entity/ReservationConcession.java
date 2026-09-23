package btl.vexemphim.booking.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "reservation_concessions")
public class ReservationConcession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "reservation_id")
    @JsonIgnore
    private Reservation reservation;

    @Column(name = "product_id")
    private Long productId;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int qty;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Reservation getReservation() { return reservation; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }

    public BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(qty));
    }
}
