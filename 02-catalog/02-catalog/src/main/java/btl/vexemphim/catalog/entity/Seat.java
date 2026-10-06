package btl.vexemphim.catalog.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "seats", uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "row_label", "number"}))
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "room_id")
    @JsonIgnore
    private Room room;

    @Column(name = "row_label", length = 8, nullable = false)
    private String rowLabel;

    @Column(nullable = false)
    private int number;

    @Column(length = 16)
    private String type = "STANDARD";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
    public String getRowLabel() { return rowLabel; }
    public void setRowLabel(String rowLabel) { this.rowLabel = rowLabel; }
    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String label() {
        return rowLabel + number;
    }
}
