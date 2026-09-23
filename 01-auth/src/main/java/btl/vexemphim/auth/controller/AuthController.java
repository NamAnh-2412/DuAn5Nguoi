package btl.vexemphim.auth.controller;

import btl.vexemphim.auth.dto.AuthResponse;
import btl.vexemphim.auth.dto.LoginRequest;
import btl.vexemphim.auth.dto.RegisterRequest;
import btl.vexemphim.auth.dto.UserResponse;
import btl.vexemphim.auth.service.AuthService;
import btl.vexemphim.common.security.AuthContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Dịch vụ xác thực — hợp đồng REST /api/auth
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me(AuthContext.userId());
    }
}
