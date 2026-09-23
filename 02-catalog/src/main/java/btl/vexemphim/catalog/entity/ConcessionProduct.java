package btl.vexemphim.catalog.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "concession_products")
public class ConcessionProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /** FOOD | DRINK | COMBO */
    @Column(nullable = false, length = 16)
    private String type;

    /** ACTIVE | HIDDEN */
    @Column(nullable = false, length = 16)
    private String status = "ACTIVE";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
