package btl.vexemphim.catalog.service;

import btl.vexemphim.catalog.dto.CinemaSettingsRequest;
import btl.vexemphim.catalog.dto.CinemaSettingsResponse;
import btl.vexemphim.catalog.entity.CinemaSettings;
import btl.vexemphim.catalog.repository.CinemaSettingsRepository;
import btl.vexemphim.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CinemaSettingsService {

    private final CinemaSettingsRepository repository;
    private final FileStorageService files;

    public CinemaSettingsService(CinemaSettingsRepository repository, FileStorageService files) {
        this.repository = repository;
        this.files = files;
    }

    @Transactional
    public CinemaSettingsResponse get() {
        return toResponse(ensure());
    }

    @Transactional
    public CinemaSettingsResponse updateName(CinemaSettingsRequest req) {
        String name = req.name() == null ? "" : req.name().trim();
        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Nhập tên rạp");
        }
        if (name.length() > 128) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Tên rạp tối đa 128 ký tự");
        }
        CinemaSettings s = ensure();
        s.setName(name);
        return toResponse(s);
    }

    @Transactional
    public CinemaSettingsResponse uploadLogo(MultipartFile file) {
        CinemaSettings s = ensure();
        s.setLogoUrl(files.saveImage(file));
        return toResponse(s);
    }

    @Transactional
    public CinemaSettingsResponse uploadImage(MultipartFile file) {
        CinemaSettings s = ensure();
        s.setImageUrl(files.saveImage(file));
        return toResponse(s);
    }

    private CinemaSettings ensure() {
        return repository.findAll().stream().findFirst().orElseGet(() -> {
            CinemaSettings s = new CinemaSettings();
            s.setName("CineVe");
            return repository.save(s);
        });
    }

    private static CinemaSettingsResponse toResponse(CinemaSettings s) {
        return new CinemaSettingsResponse(s.getName(), s.getLogoUrl(), s.getImageUrl());
    }
}
