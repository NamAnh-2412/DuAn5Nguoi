package btl.vexemphim.catalog.service;

import btl.vexemphim.catalog.dto.GenreRequest;
import btl.vexemphim.catalog.dto.GenreResponse;
import btl.vexemphim.catalog.dto.MovieResponse;
import btl.vexemphim.catalog.entity.Genre;
import btl.vexemphim.catalog.repository.GenreRepository;
import btl.vexemphim.catalog.repository.MovieRepository;
import btl.vexemphim.common.exception.ApiException;
import btl.vexemphim.common.security.AuthContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GenreService {

    private final GenreRepository genreRepository;
    private final MovieRepository movieRepository;

    public GenreService(GenreRepository genreRepository, MovieRepository movieRepository) {
        this.genreRepository = genreRepository;
        this.movieRepository = movieRepository;
    }

    public List<GenreResponse> findAll() {
        return genreRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public GenreResponse findById(Long id) {
        return toResponse(get(id));
    }

    public Genre get(Long id) {
        return genreRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy thể loại"));
    }

    public List<MovieResponse> moviesOf(Long genreId) {
        get(genreId);
        boolean admin = "ADMIN".equals(AuthContext.role());
        return movieRepository.findByGenre_Id(genreId).stream()
                .filter(m -> admin || !"HIDDEN".equals(m.getStatus()))
                .map(MovieService::toResponse)
                .toList();
    }

    @Transactional
    public GenreResponse create(GenreRequest req) {
        Genre g = new Genre();
        g.setName(req.name().trim());
        genreRepository.save(g);
        return toResponse(g);
    }

    @Transactional
    public GenreResponse update(Long id, GenreRequest req) {
        Genre g = get(id);
        g.setName(req.name().trim());
        return toResponse(g);
    }

    @Transactional
    public void delete(Long id) {
        Genre g = get(id);
        if (movieRepository.existsByGenre_Id(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "GENRE_IN_USE", "Thể loại còn phim, không xóa được");
        }
        genreRepository.delete(g);
    }

    private GenreResponse toResponse(Genre g) {
        return new GenreResponse(g.getId(), g.getName(), movieRepository.countByGenre_Id(g.getId()));
    }
}
