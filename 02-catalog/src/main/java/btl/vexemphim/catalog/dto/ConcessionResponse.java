package btl.vexemphim.catalog.dto;

import java.math.BigDecimal;

public record ConcessionResponse(Long id, String name, BigDecimal price, String type, String status) {
}
