import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { assetUrl } from "../lib/assetUrl";
import ThemeToggle from "./ThemeToggle";
import "../admin.css";

const links = [
  { to: "/", label: "Trang chủ" },
  { to: "/admin/movies", label: "Phim" },
  { to: "/admin/genres", label: "Thể loại" },
  { to: "/admin/showtimes", label: "Suất chiếu" },
  { to: "/admin/concessions", label: "Đồ ăn vặt" },
  { to: "/admin/reports", label: "Báo cáo" },
  { to: "/admin/settings", label: "Cài đặt" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { name, logoUrl } = useBrand();
  const nav = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="admin-aside">
        <div className="admin-brand">
          <Link to="/" className="admin-brand-row">
            {logoUrl ? (
              <img className="admin-brand-logo" src={assetUrl(logoUrl)} alt="" />
            ) : null}
            <div>
              <div className="admin-brand-title">{name}</div>
              <div className="admin-brand-sub">Về trang chủ</div>
            </div>
          </Link>
        </div>
        <nav className="admin-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => (isActive ? "admin-nav-on" : "admin-nav-item")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-aside-foot">
          <div className="admin-user">{user?.username} · ADMIN</div>
          <ThemeToggle compact />
          <button
            className="admin-logout"
            type="button"
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
