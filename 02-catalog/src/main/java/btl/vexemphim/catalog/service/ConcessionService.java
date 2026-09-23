package btl.vexemphim.catalog.service;

import btl.vexemphim.catalog.dto.ConcessionRequest;
import btl.vexemphim.catalog.dto.ConcessionResponse;
import btl.vexemphim.catalog.entity.ConcessionProduct;
import btl.vexemphim.catalog.repository.ConcessionProductRepository;
import btl.vexemphim.common.exception.ApiException;
import btl.vexemphim.common.security.AuthContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class ConcessionService {

    private static final Set<String> TYPES = Set.of("FOOD", "DRINK", "COMBO");
    private static final Set<String> STATUSES = Set.of("ACTIVE", "HIDDEN");

    private final ConcessionProductRepository repository;

    public ConcessionService(ConcessionProductRepository repository) {
        this.repository = repository;
    }

    public List<ConcessionResponse> list() {
        boolean admin = "ADMIN".equals(AuthContext.role());
        List<ConcessionProduct> list = admin
                ? repository.findAllByOrderByTypeAscNameAsc()
                : repository.findByStatusOrderByTypeAscNameAsc("ACTIVE");
        return list.stream().map(ConcessionService::toResponse).toList();
    }

    public ConcessionProduct get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy món"));
    }

    @Transactional
    public ConcessionResponse create(ConcessionRequest req) {
        String name = req.name().trim();
        if (repository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "CONCESSION_NAME_TAKEN", "Tên món đã tồn tại");
        }
        ConcessionProduct p = new ConcessionProduct();
        p.setName(name);
        p.setPrice(req.price());
        p.setType(normalizeType(req.type()));
        p.setStatus(normalizeStatus(req.status() == null ? "ACTIVE" : req.status()));
        repository.save(p);
        return toResponse(p);
    }

    @Transactional
    public ConcessionResponse update(Long id, ConcessionRequest req) {
        ConcessionProduct p = get(id);
        String name = req.name().trim();
        if (repository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ApiException(HttpStatus.CONFLICT, "CONCESSION_NAME_TAKEN", "Tên món đã tồn tại");
        }
        p.setName(name);
        p.setPrice(req.price());
        p.setType(normalizeType(req.type()));
        p.setStatus(normalizeStatus(req.status() == null ? p.getStatus() : req.status()));
        return toResponse(p);
    }

    private static String normalizeType(String type) {
        String t = type == null ? "" : type.trim().toUpperCase();
        if (!TYPES.contains(t)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Loại phải là FOOD, DRINK hoặc COMBO");
        }
        return t;
    }

    private static String normalizeStatus(String status) {
        String s = status == null ? "" : status.trim().toUpperCase();
        if (!STATUSES.contains(s)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Trạng thái phải là ACTIVE hoặc HIDDEN");
        }
        return s;
    }

    private static ConcessionResponse toResponse(ConcessionProduct p) {
        return new ConcessionResponse(p.getId(), p.getName(), p.getPrice(), p.getType(), p.getStatus());
    }
}
