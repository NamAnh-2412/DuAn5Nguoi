package btl.vexemphim.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ConcessionRequest(
        @NotBlank String name,
        @NotNull @DecimalMin("0") BigDecimal price,
        @NotBlank String type,
        String status
) {
}
