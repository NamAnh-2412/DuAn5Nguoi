package btl.vexemphim.catalog.repository;

import btl.vexemphim.catalog.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MovieRepository extends JpaRepository<Movie, Long>, JpaSpecificationExecutor<Movie> {
    Page<Movie> findByTitleContainingIgnoreCaseAndStatus(String title, String status, Pageable pageable);
    Page<Movie> findByStatus(String status, Pageable pageable);
    boolean existsByGenre_Id(Long genreId);

    long countByGenre_Id(Long genreId);

    java.util.List<Movie> findByGenre_Id(Long genreId);
}
