package duan5nguoi.auth;

import java.util.LinkedHashMap;
import java.util.Map;

public final class AuthService {
    public record Session(long userId, String username, String role) {}

    private record User(long id, String username, String password, String role) {}

    private final Map<String, User> users = new LinkedHashMap<>();
    private long seq = 1;

    public AuthService() {
        add("admin", "admin123", "ADMIN");
        add("NhanVien", "nhanvien123", "CASHIER");
        add("customer1", "customer123", "CUSTOMER");
    }

    public Session register(String username, String password) {
        if (users.containsKey(username)) {
            throw new IllegalArgumentException("USERNAME_TAKEN");
        }
        User created = add(username, password, "CUSTOMER");
        return session(created);
    }

    public Session login(String username, String password) {
        User user = users.get(username);
        if (user == null || !user.password.equals(password)) {
            throw new SecurityException("UNAUTHORIZED");
        }
        return session(user);
    }

    private User add(String username, String password, String role) {
        User user = new User(seq++, username, password, role);
        users.put(username, user);
        return user;
    }

    private static Session session(User user) {
        return new Session(user.id, user.username, user.role);
    }
}
