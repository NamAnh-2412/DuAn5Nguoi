package btl.vexemphim.catalog.repository;

import btl.vexemphim.catalog.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenreRepository extends JpaRepository<Genre, Long> {
    boolean existsByNameIgnoreCase(String name);
}
