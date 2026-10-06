package btl.vexemphim.catalog.controller;

import btl.vexemphim.catalog.dto.GenreRequest;
import btl.vexemphim.catalog.dto.GenreResponse;
import btl.vexemphim.catalog.dto.MovieResponse;
import btl.vexemphim.catalog.service.GenreService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Dịch vụ danh mục — thể loại (1-N phim). */
@RestController
@RequestMapping("/api/genres")
public class GenreController {

    private final GenreService genreService;

    public GenreController(GenreService genreService) {
        this.genreService = genreService;
    }

    @GetMapping
    public List<GenreResponse> all() {
        return genreService.findAll();
    }

    @GetMapping("/{id}")
    public GenreResponse one(@PathVariable Long id) {
        return genreService.findById(id);
    }

    @GetMapping("/{id}/movies")
    public List<MovieResponse> movies(@PathVariable Long id) {
        return genreService.moviesOf(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GenreResponse> create(@Valid @RequestBody GenreRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(genreService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public GenreResponse update(@PathVariable Long id, @Valid @RequestBody GenreRequest req) {
        return genreService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        genreService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
