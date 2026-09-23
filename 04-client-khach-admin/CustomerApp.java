package duan5nguoi.customer;

import duan5nguoi.auth.AuthService;
import duan5nguoi.booking.BookingService;
import duan5nguoi.catalog.CatalogService;

public final class CustomerApp {
    public static void main(String[] args) {
        AuthService auth = new AuthService();
        CatalogService catalog = new CatalogService();
        BookingService booking = new BookingService(catalog);

        AuthService.Session customer = auth.login("customer1", "customer123");
        long showtimeId = catalog.listByMovie(1).getFirst().id();
        String holdKey = booking.hold(customer, showtimeId, "A5", "ONLINE");
        String ticket = booking.confirm(customer, holdKey);
        System.out.println("ONLINE " + customer.username() + " ve " + ticket);
    }
}
