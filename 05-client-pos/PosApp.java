package duan5nguoi.pos;

import duan5nguoi.auth.AuthService;
import duan5nguoi.booking.BookingService;
import duan5nguoi.catalog.CatalogService;

public final class PosApp {
    public static void main(String[] args) {
        AuthService auth = new AuthService();
        CatalogService catalog = new CatalogService();
        BookingService booking = new BookingService(catalog);

        AuthService.Session customer = auth.login("customer1", "customer123");
        AuthService.Session cashier = auth.login("NhanVien", "nhanvien123");
        long showtimeId = catalog.listByMovie(1).getFirst().id();
        booking.hold(customer, showtimeId, "A5", "ONLINE");
        try {
            booking.hold(cashier, showtimeId, "A5", "POS");
        } catch (IllegalStateException ex) {
            System.out.println("POS " + cashier.username() + " " + ex.getMessage());
        }
    }
}
