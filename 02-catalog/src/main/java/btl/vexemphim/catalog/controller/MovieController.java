package btl.vexemphim.catalog.controller;

import btl.vexemphim.catalog.dto.MovieDetailResponse;
import btl.vexemphim.catalog.dto.MovieRequest;
import btl.vexemphim.catalog.dto.MovieResponse;
import btl.vexemphim.catalog.dto.PosterUploadResponse;
import btl.vexemphim.catalog.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public Page<MovieResponse> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return movieService.search(name, genreId, status, pageable);
    }

    @GetMapping("/{id}")
    public MovieDetailResponse one(@PathVariable Long id) {
        return movieService.getDetail(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> create(@Valid @RequestBody MovieRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movieService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MovieResponse update(@PathVariable Long id, @Valid @RequestBody MovieRequest req) {
        return movieService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> hide(@PathVariable Long id) {
        movieService.hide(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/upload-poster")
    @PreAuthorize("hasRole('ADMIN')")
    public PosterUploadResponse upload(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return movieService.uploadPoster(id, file);
    }
}
