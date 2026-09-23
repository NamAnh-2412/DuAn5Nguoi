package btl.vexemphim.auth.dto;

public record AuthResponse(String token, Long userId, String username, String role) {
}
