package btl.vexemphim.catalog.controller;

import btl.vexemphim.catalog.dto.CinemaSettingsRequest;
import btl.vexemphim.catalog.dto.CinemaSettingsResponse;
import btl.vexemphim.catalog.service.CinemaSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/settings")
public class CinemaSettingsController {

    private final CinemaSettingsService cinemaSettingsService;

    public CinemaSettingsController(CinemaSettingsService cinemaSettingsService) {
        this.cinemaSettingsService = cinemaSettingsService;
    }

    @GetMapping
    public CinemaSettingsResponse get() {
        return cinemaSettingsService.get();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CinemaSettingsResponse update(@Valid @RequestBody CinemaSettingsRequest req) {
        return cinemaSettingsService.updateName(req);
    }

    @PostMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public CinemaSettingsResponse logo(@RequestParam("file") MultipartFile file) {
        return cinemaSettingsService.uploadLogo(file);
    }

    @PostMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public CinemaSettingsResponse image(@RequestParam("file") MultipartFile file) {
        return cinemaSettingsService.uploadImage(file);
    }
}
