package btl.vexemphim.auth.service;

import btl.vexemphim.auth.dto.AuthResponse;
import btl.vexemphim.auth.dto.LoginRequest;
import btl.vexemphim.auth.dto.RegisterRequest;
import btl.vexemphim.auth.dto.UserResponse;
import btl.vexemphim.auth.entity.Role;
import btl.vexemphim.auth.entity.User;
import btl.vexemphim.auth.repository.UserRepository;
import btl.vexemphim.common.exception.ApiException;
import btl.vexemphim.common.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_FAILED", "Sai tài khoản hoặc mật khẩu"));
        if (!user.isEnabled() || !passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_FAILED", "Sai tài khoản hoặc mật khẩu");
        }
        String token = jwtService.createToken(user.getId(), user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole().name());
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "USERNAME_TAKEN", "Username đã tồn tại");
        }
        User user = new User();
        user.setUsername(req.username());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(Role.CUSTOMER);
        userRepository.save(user);
        return new UserResponse(user.getId(), user.getUsername(), user.getRole().name());
    }

    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy user"));
        return new UserResponse(user.getId(), user.getUsername(), user.getRole().name());
    }
}
