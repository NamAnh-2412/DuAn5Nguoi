package btl.vexemphim.catalog.repository;

import btl.vexemphim.catalog.entity.ConcessionProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConcessionProductRepository extends JpaRepository<ConcessionProduct, Long> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<ConcessionProduct> findByStatusOrderByTypeAscNameAsc(String status);

    List<ConcessionProduct> findAllByOrderByTypeAscNameAsc();
}
