package btl.vexemphim.catalog.controller;

import btl.vexemphim.catalog.dto.ShowtimeRequest;
import btl.vexemphim.catalog.dto.ShowtimeResponse;
import btl.vexemphim.catalog.service.ShowtimeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    public ShowtimeController(ShowtimeService showtimeService) {
        this.showtimeService = showtimeService;
    }

    @GetMapping
    public List<ShowtimeResponse> list(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, defaultValue = "false") boolean includePast) {
        return showtimeService.list(movieId, date, includePast);
    }

    @GetMapping("/{id}")
    public ShowtimeResponse one(@PathVariable Long id) {
        return showtimeService.getResponse(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowtimeResponse> create(@Valid @RequestBody ShowtimeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(showtimeService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ShowtimeResponse update(@PathVariable Long id, @Valid @RequestBody ShowtimeRequest req) {
        return showtimeService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        showtimeService.cancel(id);
        return ResponseEntity.noContent().build();
    }
}
