package btl.vexemphim.catalog.service;

import btl.vexemphim.catalog.dto.MovieDetailResponse;
import btl.vexemphim.catalog.dto.MovieRequest;
import btl.vexemphim.catalog.dto.MovieResponse;
import btl.vexemphim.catalog.dto.PosterUploadResponse;
import btl.vexemphim.catalog.entity.Genre;
import btl.vexemphim.catalog.entity.Movie;
import btl.vexemphim.catalog.repository.GenreRepository;
import btl.vexemphim.catalog.repository.MovieRepository;
import btl.vexemphim.common.exception.ApiException;
import btl.vexemphim.common.security.AuthContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
public class MovieService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final FileStorageService fileStorageService;

    public MovieService(MovieRepository movieRepository, GenreRepository genreRepository,
                        FileStorageService fileStorageService) {
        this.movieRepository = movieRepository;
        this.genreRepository = genreRepository;
        this.fileStorageService = fileStorageService;
    }

    public static MovieResponse toResponse(Movie m) {
        Long gid = m.getGenre() == null ? null : m.getGenre().getId();
        String gname = m.getGenre() == null ? null : m.getGenre().getName();
        return new MovieResponse(m.getId(), m.getTitle(), m.getDurationMinutes(), m.getRated(),
                m.getPosterUrl(), gid, gname, m.getStatus(),
                m.getTrailerUrl(), m.getDirector(), m.getCastNames(), m.getReleaseDate());
    }

    public Page<MovieResponse> search(String name, Long genreId, String status, Pageable pageable) {
        boolean admin = "ADMIN".equals(AuthContext.role());
        String st = status == null || status.isBlank() ? "SHOWING" : status;
        if (!admin && "HIDDEN".equals(st)) {
            st = "SHOWING";
        }
        final String filterStatus = st;
        Specification<Movie> spec = (root, q, cb) -> cb.conjunction();
        if (!admin) {
            spec = spec.and((root, q, cb) -> cb.notEqual(root.get("status"), "HIDDEN"));
            if (!"COMING".equals(filterStatus)) {
                spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), filterStatus));
            } else {
                spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), "COMING"));
            }
        } else if (!"ALL".equalsIgnoreCase(filterStatus)) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), filterStatus));
        }
        if (name != null && !name.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("title")), "%" + name.toLowerCase() + "%"));
        }
        if (genreId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("genre").get("id"), genreId));
        }
        return movieRepository.findAll(spec, pageable).map(MovieService::toResponse);
    }

    public MovieDetailResponse getDetail(Long id) {
        Movie m = get(id);
        boolean admin = "ADMIN".equals(AuthContext.role());
        if ("HIDDEN".equals(m.getStatus()) && !admin) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phim");
        }
        Long gid = m.getGenre() == null ? null : m.getGenre().getId();
        String gname = m.getGenre() == null ? null : m.getGenre().getName();
        return new MovieDetailResponse(m.getId(), m.getTitle(), m.getDurationMinutes(), m.getRated(),
                m.getDescription(), m.getPosterUrl(), gid, gname, m.getStatus(),
                m.getTrailerUrl(), m.getDirector(), m.getCastNames(), m.getReleaseDate());
    }

    public Movie get(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phim"));
    }

    @Transactional
    public MovieResponse create(MovieRequest req) {
        Movie m = new Movie();
        apply(m, req);
        movieRepository.save(m);
        return toResponse(m);
    }

    @Transactional
    public MovieResponse update(Long id, MovieRequest req) {
        Movie m = get(id);
        apply(m, req);
        return toResponse(m);
    }

    @Transactional
    public void hide(Long id) {
        Movie m = get(id);
        m.setStatus("HIDDEN");
    }

    @Transactional
    public PosterUploadResponse uploadPoster(Long id, MultipartFile file) {
        Movie m = get(id);
        String path = fileStorageService.saveImage(file);
        m.setPosterUrl(path);
        return new PosterUploadResponse(path);
    }

    private void apply(Movie m, MovieRequest req) {
        m.setTitle(req.title().trim());
        m.setDurationMinutes(req.durationMinutes());
        m.setRated(req.rated());
        m.setDescription(req.description());
        m.setTrailerUrl(blankToNull(req.trailerUrl()));
        m.setDirector(blankToNull(req.director()));
        m.setCastNames(blankToNull(req.castNames()));
        m.setReleaseDate(req.releaseDate());
        m.setStatus(normalizeStatus(req.status()));
        if (req.genre() != null && req.genre().id() != null) {
            Genre g = genreRepository.findById(req.genre().id())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Thể loại không tồn tại"));
            m.setGenre(g);
        }
    }

    private static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "SHOWING";
        }
        String st = status.trim().toUpperCase();
        if (!st.equals("SHOWING") && !st.equals("COMING") && !st.equals("HIDDEN")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "status phải là SHOWING, COMING hoặc HIDDEN");
        }
        return st;
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
