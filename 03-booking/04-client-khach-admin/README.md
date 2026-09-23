# 04 — Client khách và admin danh mục

Người 4. Giao diện đặt vé online và form quản trị phim, thể loại, suất, bắp nước, cài đặt rạp. Mọi dữ liệu lấy từ REST `http://localhost:8080`. Không kết nối MySQL.

## Mã trong thư mục này

`src/pages/` (trang khách và admin danh mục), `src/components/`, `src/context/`, `src/api/` (auth và catalog), `src/App.tsx`, `src/main.tsx`.

`CustomerApp.java` ở ngay thư mục này là bản rút gọn (package `duan5nguoi.customer`) để chạy luồng đặt vé online.

## Tham chiếu trong project gốc

`WebVeXemPhim/web-client/src/`

Trang khách:

- `pages/HomePage.tsx`
- `pages/MovieDetailPage.tsx` (cả route `/movies/:id` và `/showtimes/:id`)
- `pages/RegisterPage.tsx`
- `pages/LoginPage.tsx` khi không phải POS
- `pages/SeatMapPage.tsx`, `ConcessionPage.tsx`, `CheckoutPage.tsx` với `channel="ONLINE"`
- `pages/TicketsPage.tsx`

Admin danh mục:

- `pages/admin/MovieAdminPage.tsx`
- `pages/admin/GenreAdminPage.tsx`
- `pages/admin/ShowtimeAdminPage.tsx`
- `pages/admin/ConcessionAdminPage.tsx`
- `pages/admin/SettingsAdminPage.tsx`
- `components/AdminLayout.tsx`

Gọi API qua `web-client/src/api/`.

## Luồng

Phim đang chiếu → chọn ngày → chọn giờ → ghế → bắp nước (tuỳ chọn) → thanh toán giả lập → mã vé.

Phim `COMING`: thông báo chưa mở bán, không render lịch.

Admin xem lịch trên trang phim nhưng không đặt vé. Form suất gọi `GET /api/rooms` và `GET /api/showtimes?includePast=true`.

## Gọi module nào

| Việc trên UI | API | Module |
|---|---|---|
| Đăng ký, đăng nhập khách | `/api/auth/*` | 01-auth |
| Danh sách phim, poster, suất, phòng | `/api/movies`, `/api/showtimes`, `/api/rooms` | 02-catalog |
| Ghi admin kèm `X-API-KEY` | POST/PUT/DELETE catalog | 02-catalog |
| Giữ ghế, thanh toán, vé của tôi | `/api/bookings/*` | 03-booking |

`SeatMapPage` và `CheckoutPage` dùng chung với POS. Người 4 giữ nhánh `channel="ONLINE"`. Route `/pos/**` thuộc người 5.

## Việc giao diện còn mở ở trang khách

`MovieDetailPage` đang dùng ô chọn ngày. Hướng đã chốt trong `WebVeXemPhim/docs/11-phuong-an-suat-chieu.md`: dải 7 ngày, chip giờ theo phòng, empty state khi ngày không có suất. Không hiện occupancy trên chip khách.

## Không làm

Không màn POS, không in vé quầy, không trang doanh thu (`ReportAdminPage`, `PosRevenuePage`).
