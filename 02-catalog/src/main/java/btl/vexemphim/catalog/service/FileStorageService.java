package btl.vexemphim.catalog.service;

import btl.vexemphim.common.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Set<String> IMAGE_EXTS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");

    private final Path uploadDir;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String dir) {
        this.uploadDir = Path.of(dir);
    }

    public String saveImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Chưa chọn ảnh");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Ảnh tối đa 5MB");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!IMAGE_TYPES.contains(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Chỉ nhận JPG, PNG, WEBP, GIF");
        }
        String original = file.getOriginalFilename() == null ? "poster.jpg" : file.getOriginalFilename();
        String ext = extensionOf(original);
        if (!IMAGE_EXTS.contains(ext)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Đuôi file ảnh không hợp lệ");
        }
        return save(file);
    }

    public String save(MultipartFile file) {
        try {
            Files.createDirectories(uploadDir);
            String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String safe = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String name = UUID.randomUUID() + "_" + safe;
            Path target = uploadDir.resolve(name);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "uploads/" + name;
        } catch (IOException e) {
            throw new RuntimeException("Không lưu được file", e);
        }
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0) {
            return "";
        }
        return filename.substring(dot).toLowerCase(Locale.ROOT);
    }
}
