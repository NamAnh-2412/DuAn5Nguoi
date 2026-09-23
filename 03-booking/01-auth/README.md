# 01 — Auth

Người 1. Đăng nhập, đăng ký khách, phát JWT. Các module khác không đọc bảng `users`. Chúng chỉ nhận claim sau khi request đã có token.

## Mã trong thư mục này

`src/main/java/btl/vexemphim/auth/` và `src/main/java/btl/vexemphim/common/` (security, CORS, API key, exception), cùng `VexemphimApplication.java`.

`AuthService.java` ở ngay thư mục này là bản Java rút gọn để chạy thử liên kết 5 module. Package `duan5nguoi.auth`, khác package Spring `btl.vexemphim.auth`.

## Tham chiếu trong project gốc

`WebVeXemPhim/vexemphim-api/src/main/java/btl/vexemphim/auth/`

- `controller/AuthController.java`
- `service/AuthService.java`
- `repository/UserRepository.java`
- `entity/User.java`, `entity/Role.java`

Nền dùng chung, người 1 giữ và không để người khác sửa: `common/security/` (`JwtService`, `AuthContext`, `SecurityConfig`) và `common/config/` (CORS cổng 5173, `ApiKeyInterceptor`).

## Việc của module

- `POST /api/auth/register` tạo đúng role `CUSTOMER`.
- `POST /api/auth/login` trả JWT. Claim: `sub` (username), `userId`, `role`.
- `GET /api/auth/me` yêu cầu Bearer.
- Mật khẩu BCrypt. Seed sẵn `ADMIN`, `CASHIER`, `CUSTOMER`.
- Sai mật khẩu → 401.

Cashier và admin không tự đăng ký qua API public.

## Đưa cho module khác

`AuthContext.userId()` và `AuthContext.role()` sau filter JWT.

Role hợp lệ: `ADMIN`, `CASHIER`, `CUSTOMER`.

## Không làm

Không giữ ghế, không trả vé, không CRUD phim. Không nhận `?role=` trên query.
