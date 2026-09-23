# 03 — Booking

Người 3. Nguồn sự thật của ghế đang giữ, ghế đã bán, vé và thanh toán. Online và POS dùng cùng service, khác trường `channel`.

## Mã trong thư mục này

`src/main/java/btl/vexemphim/booking/` — giữ ghế, vé, soát cửa, báo cáo.

`BookingService.java` ở ngay thư mục này là bản rút gọn (package `duan5nguoi.booking`) để chạy thử `SEAT_TAKEN`.

## Tham chiếu trong project gốc

`WebVeXemPhim/vexemphim-api/src/main/java/btl/vexemphim/booking/`

- `BookingService` — cửa ra duy nhất cho giữ ghế và vé
- `HoldExpiryScheduler`
- `ReportService`, `ReportController`
- `BookingController`, `PosBookingController`, `TicketController`

Bảng: `reservations`, `reservation_seats`, `reservation_concessions`, `tickets`, `payments`.

Unique `(showtime_id, seat_id)` với ghế đang `HOLD` hoặc thuộc đơn `CONFIRMED`.

## API

- `GET /api/bookings/showtimes/{showtimeId}/seat-map`
- `POST /api/bookings/hold`
- `POST /api/bookings/{id}/confirm` — thanh toán giả lập, kênh `ONLINE`
- `PUT /api/bookings/{id}/concessions`
- `DELETE /api/bookings/{id}` — chỉ đơn `HOLD`, trả 204
- `GET /api/bookings/my` — `userId` từ JWT
- `GET /api/bookings/{id}`
- `GET /api/bookings/occupancy?showtimeId=` — `ADMIN` và `CASHIER`
- `POST /api/pos/bookings/{id}/confirm-cash` — `CASHIER`
- `GET /api/tickets/{ticketCode}` — `CASHIER`, `ADMIN`
- `POST /api/tickets/{ticketCode}/check-in` — một lần, trạng thái `CHECKED_IN`
- `GET /api/reports/revenue` — `ADMIN`, `CASHIER`

Hold mặc định 8 phút (`app.hold-minutes`). Hết hạn → `409 HOLD_EXPIRED`. Trùng ghế → `409 SEAT_TAKEN`.

POS vãng lai: `customerUserId` để trống, `cashierUserId` lấy từ JWT, `channel=POS`.

## Cần từ module khác

Từ **02-catalog**: suất còn bán được, layout ghế, giá bắp nước. Không tự ghi bảng `showtimes` hay `seats`.

Từ **01-auth**: `userId` và `role`. Không tra mật khẩu.

Trang doanh thu trên React thuộc người 5 (`05-client-pos`). Người 3 giữ JSON của `GET /api/reports/revenue`.

## Không làm

Không CRUD phim. Không upload poster. Không sửa form admin thể loại.
