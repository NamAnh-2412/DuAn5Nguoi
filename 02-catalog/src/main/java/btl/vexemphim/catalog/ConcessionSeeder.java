package btl.vexemphim.catalog;

import btl.vexemphim.catalog.entity.ConcessionProduct;
import btl.vexemphim.catalog.repository.ConcessionProductRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class ConcessionSeeder implements ApplicationRunner {

    private final ConcessionProductRepository repository;

    public ConcessionSeeder(ConcessionProductRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }
        repository.saveAll(List.of(
                product("Bắp rang nhỏ", "45000", "FOOD"),
                product("Bắp rang lớn", "65000", "FOOD"),
                product("Pepsi", "39000", "DRINK"),
                product("Nước suối", "20000", "DRINK"),
                product("Combo bắp lớn + Pepsi", "89000", "COMBO"),
                product("Combo đôi", "129000", "COMBO")
        ));
    }

    private static ConcessionProduct product(String name, String price, String type) {
        ConcessionProduct p = new ConcessionProduct();
        p.setName(name);
        p.setPrice(new BigDecimal(price));
        p.setType(type);
        p.setStatus("ACTIVE");
        return p;
    }
}
