# 05 — Client POS

Người 5. Giao diện thu ngân: bán vé tại quầy, in, soát cửa, xem doanh thu. Cùng API giữ ghế với kênh khách. Khác ở role `CASHIER`, `channel=POS` và thu tiền mặt.

## Mã trong thư mục này

`src/pages/pos/`, `src/pages/admin/ReportAdminPage.tsx`, `src/api/bookingApi.ts`.

`PosApp.java` ở ngay thư mục này là bản rút gọn (package `duan5nguoi.pos`) để chạy thử giữ trùng ghế.

## Tham chiếu trong project gốc

`WebVeXemPhim/web-client/src/pages/pos/`

- `PosHomePage.tsx` — `/pos`
- `PosShowtimesPage.tsx` — suất theo ngày
- `PosPrintPage.tsx` — `/pos/print/:reservationId`
- `PosScanPage.tsx` — `/pos/tickets`
- `PosRevenuePage.tsx` — `/pos/revenue`

Dùng chung màn ghế và thanh toán khi `channel="POS"`:

- `/pos/book/:showtimeId`
- `/pos/concessions/:reservationId`
- `/pos/checkout/:reservationId`

Đăng nhập quầy: `/pos/login` (cùng `LoginPage` với cờ POS).

Báo cáo admin: `pages/admin/ReportAdminPage.tsx` gọi `GET /api/reports/revenue`. JSON do người 3 giữ trong `03-booking`.

## Gọi module nào

| Việc trên quầy | API | Module |
|---|---|---|
| Đăng nhập nhân viên | `POST /api/auth/login` | 01-auth |
| Suất trong ngày, phòng, bắp nước | `/api/showtimes`, `/api/rooms`, `/api/concessions` | 02-catalog |
| Sơ đồ ghế, hold, hủy hold | `/api/bookings/*` | 03-booking |
| Thu tiền mặt | `POST /api/pos/bookings/{id}/confirm-cash` | 03-booking |
| Soát vé một lần | `GET` và `POST /api/tickets/{code}/check-in` | 03-booking |
| Ghế đã bán trên suất | `GET /api/bookings/occupancy` | 03-booking |
| Doanh thu | `GET /api/reports/revenue` | 03-booking |

Khách `CUSTOMER` vào `/pos` thì đưa về trang khách. Hết phiên thu ngân thì về `/pos/login`.

## Phạm vi màn quầy

- In chỉ vùng vé (`@media print`), không in nền trang.
- Soát vé: mã đúng, mã sai, vé đã `CHECKED_IN`.
- Chọn suất mặc định hôm nay. Số ghế bán lấy từ occupancy, không tự đếm ở catalog.
- Không điền sẵn mật khẩu trên form đăng nhập quầy khi nộp bài.

## Không làm

Không form admin phim, thể loại, suất. Không đổi unique ghế. Không thêm cổng thanh toán thật.
