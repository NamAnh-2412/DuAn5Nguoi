package btl.vexemphim.catalog.controller;

import btl.vexemphim.catalog.dto.RoomRequest;
import btl.vexemphim.catalog.dto.RoomResponse;
import btl.vexemphim.catalog.dto.RoomUpdateRequest;
import btl.vexemphim.catalog.dto.SeatLayoutResponse;
import btl.vexemphim.catalog.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<RoomResponse> all() {
        return roomService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoomResponse> create(@Valid @RequestBody RoomRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RoomResponse update(@PathVariable Long id, @RequestBody RoomUpdateRequest req) {
        return roomService.update(id, req);
    }

    @GetMapping("/{id}/seats")
    public List<SeatLayoutResponse> seats(@PathVariable Long id) {
        return roomService.seats(id);
    }
}
