package btl.vexemphim.catalog.service;

import btl.vexemphim.catalog.dto.RoomRequest;
import btl.vexemphim.catalog.dto.RoomResponse;
import btl.vexemphim.catalog.dto.RoomUpdateRequest;
import btl.vexemphim.catalog.dto.SeatLayoutResponse;
import btl.vexemphim.catalog.entity.Room;
import btl.vexemphim.catalog.entity.Seat;
import btl.vexemphim.catalog.repository.RoomRepository;
import btl.vexemphim.catalog.repository.SeatRepository;
import btl.vexemphim.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;

    public RoomService(RoomRepository roomRepository, SeatRepository seatRepository) {
        this.roomRepository = roomRepository;
        this.seatRepository = seatRepository;
    }

    public List<RoomResponse> findAll() {
        return roomRepository.findAll().stream()
                .map(RoomService::toResponse)
                .toList();
    }

    @Transactional
    public RoomResponse create(RoomRequest req) {
        String name = req.name().trim();
        if (roomRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "ROOM_NAME_TAKEN", "Tên phòng đã tồn tại");
        }
        int vip = req.vipRowCount();
        if (vip > req.rowCount()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Số hàng VIP không được lớn hơn số hàng");
        }
        Room room = new Room();
        room.setName(name);
        room.setRowCount(req.rowCount());
        room.setSeatsPerRow(req.seatsPerRow());
        room.setStatus("ACTIVE");
        for (int row = 1; row <= req.rowCount(); row++) {
            String label = String.valueOf((char) ('A' + row - 1));
            boolean vipRow = row > req.rowCount() - vip;
            for (int n = 1; n <= req.seatsPerRow(); n++) {
                Seat seat = new Seat();
                seat.setRoom(room);
                seat.setRowLabel(label);
                seat.setNumber(n);
                seat.setType(vipRow ? "VIP" : "STANDARD");
                room.getSeats().add(seat);
            }
        }
        roomRepository.save(room);
        return toResponse(room);
    }

    @Transactional
    public RoomResponse update(Long id, RoomUpdateRequest req) {
        Room room = get(id);
        String name = req.name() == null ? null : req.name().trim();
        String status = req.status() == null ? null : req.status().trim().toUpperCase();
        if ((name == null || name.isEmpty()) && (status == null || status.isEmpty())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Nhập tên hoặc trạng thái phòng");
        }
        if (name != null && !name.isEmpty()) {
            if (roomRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
                throw new ApiException(HttpStatus.CONFLICT, "ROOM_NAME_TAKEN", "Tên phòng đã tồn tại");
            }
            room.setName(name);
        }
        if (status != null && !status.isEmpty()) {
            if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Trạng thái phải là Dùng hoặc Dừng");
            }
            room.setStatus(status);
        }
        return toResponse(room);
    }

    private static RoomResponse toResponse(Room r) {
        return new RoomResponse(r.getId(), r.getName(), r.getRowCount(), r.getSeatsPerRow(), r.getStatus());
    }

    public Room get(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phòng"));
    }

    public List<SeatLayoutResponse> seats(Long roomId) {
        get(roomId);
        return seatRepository.findByRoom_IdOrderByRowLabelAscNumberAsc(roomId).stream()
                .map(s -> new SeatLayoutResponse(s.getId(), s.label(), s.getRowLabel(), s.getNumber(), s.getType()))
                .toList();
    }

    public List<Seat> seatsOf(Long roomId) {
        return seatRepository.findByRoom_IdOrderByRowLabelAscNumberAsc(roomId);
    }
}
