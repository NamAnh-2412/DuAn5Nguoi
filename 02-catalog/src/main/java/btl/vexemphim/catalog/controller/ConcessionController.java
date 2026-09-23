package btl.vexemphim.catalog.controller;

import btl.vexemphim.catalog.dto.ConcessionRequest;
import btl.vexemphim.catalog.dto.ConcessionResponse;
import btl.vexemphim.catalog.service.ConcessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concessions")
public class ConcessionController {

    private final ConcessionService concessionService;

    public ConcessionController(ConcessionService concessionService) {
        this.concessionService = concessionService;
    }

    @GetMapping
    public List<ConcessionResponse> all() {
        return concessionService.list();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConcessionResponse> create(@Valid @RequestBody ConcessionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(concessionService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ConcessionResponse update(@PathVariable Long id, @Valid @RequestBody ConcessionRequest req) {
        return concessionService.update(id, req);
    }
}
