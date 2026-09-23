# 02 — Catalog

Người 2. Danh mục chiếu: thể loại, phim, phòng, ghế tĩnh, suất, bắp nước, cài đặt rạp. Module này không biết ghế nào đang bị giữ hay đã bán.

## Mã trong thư mục này

`src/main/java/btl/vexemphim/catalog/` — controller, service, repository, entity, dto của phim, thể loại, phòng, suất, bắp nước, cài đặt rạp.

`CatalogService.java` ở ngay thư mục này là bản rút gọn (package `duan5nguoi.catalog`) để chạy thử chồng suất.

## Tham chiếu trong project gốc

`WebVeXemPhim/vexemphim-api/src/main/java/btl/vexemphim/catalog/`

Cửa ra cho booking:

- `ShowtimeService`
- `RoomService`
- `ConcessionService`
- `MovieService`

Bảng: `genres`, `movies`, `rooms`, `seats`, `showtimes`, `concession_products`, `cinema_settings`.

## API

Đọc công khai (khách và POS đều gọi được):

- `GET /api/genres`, `GET /api/genres/{id}`, `GET /api/genres/{id}/movies`
- `GET /api/movies` với `name`, `page`, `size`, `sort`, `status`
- `GET /api/movies/{id}`
- `GET /api/rooms`, `GET /api/rooms/{id}/seats`
- `GET /api/showtimes` theo `movieId` và `date`. Bản public ẩn suất đã qua
- `GET /api/showtimes/{id}`
- `GET /api/concessions`
- `GET /api/settings`

Ghi: role `ADMIN` và header `X-API-KEY`.

- `POST|PUT|DELETE /api/genres`, `/api/movies`
- `POST /api/movies/{id}/upload-poster`
- `POST|PUT|DELETE /api/showtimes`
- `GET /api/showtimes?includePast=true` chỉ khi JWT admin
- `POST|PUT /api/concessions`
- `PUT /api/settings`, `POST /api/settings/logo`, `POST /api/settings/image`

Suất chồng giờ cùng phòng → `409 SHOWTIME_OVERLAP`. Phim chưa `SHOWING` → `400 MOVIE_NOT_ON_SALE`. Đã có vé → `HAS_TICKETS`. Đang giữ ghế → `HAS_HOLDS`. Hủy suất là trạng thái `CANCELLED`, không xóa cứng.

Phòng lấy từ `GET /api/rooms`. Không gán cứng id phòng 1 và 2.

## Đưa cho 03-booking

- `ShowtimeService.getById`: 404 nếu không có, không cho hold nếu suất hủy hoặc phim chưa mở bán.
- Layout ghế theo `roomId`: `id`, hàng, số, loại `STANDARD` hoặc `VIP`.
- Giá sản phẩm bắp nước tại thời điểm gắn vào đơn.

Occupancy (số ghế hold / booked) thuộc `03-booking`, endpoint `GET /api/bookings/occupancy`. Catalog không import repository của booking.

## Không làm

Không bảng `reservations`. Không đếm ghế trống bằng SQL catalog. Không thanh toán, không mã vé.
