package btl.vexemphim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Điểm vào backend SOA: một process, ba dịch vụ nghiệp vụ
 * (auth / catalog / booking) phơi REST cho client.
 */
@SpringBootApplication
@EnableScheduling
public class VexemphimApplication {

    public static void main(String[] args) {
        SpringApplication.run(VexemphimApplication.class, args);
    }
}
