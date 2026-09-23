import { FormEvent, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHoldSession } from "../context/HoldSessionContext";
import { useBrand } from "../context/BrandContext";
import { assetUrl } from "../lib/assetUrl";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { abandon } = useHoldSession();
  const nav = useNavigate();
  const loc = useLocation();
  const { name, logoUrl } = useBrand();
  const [q, setQ] = useState("");
  const home = user?.role === "CASHIER" ? "/pos" : user?.role === "ADMIN" ? "/admin/movies" : "/";

  const search = (e: FormEvent) => {
    e.preventDefault();
    nav(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  };

  return (
    <header className="nav">
      <NavLink to={home} className="logo">
        {logoUrl ? (
          <img className="logo-img" src={assetUrl(logoUrl)} alt="" />
        ) : (
          <span className="logo-mark" aria-hidden><i /></span>
        )}
        <span className="logo-text">
          <strong>{name}</strong>
          <span>Đặt vé xem phim</span>
        </span>
      </NavLink>

      {user?.role !== "CASHIER" && user?.role !== "ADMIN" && (
        <form className="nav-search" onSubmit={search}>
          <span aria-hidden>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm phim..."
          />
        </form>
      )}

      <nav className="nav-links">
        {user?.role !== "CASHIER" && user?.role !== "ADMIN" && (
          <>
            <NavLink to="/" end>Chủ đề</NavLink>
            <NavLink to="/?tab=showing" className={() => (loc.search.includes("tab=showing") ? "active" : "")}>Đang chiếu</NavLink>
            <NavLink to="/?tab=coming" className={() => (loc.search.includes("tab=coming") ? "active" : "")}>Sắp chiếu<span className="nav-badge">NEW</span></NavLink>
            <NavLink to="/" end>Lịch chiếu</NavLink>
            {user?.role === "CUSTOMER" && <NavLink to="/tickets">Vé của tôi</NavLink>}
          </>
        )}
        {user?.role === "CASHIER" && (
          <>
            <NavLink to="/pos" end>Bán vé</NavLink>
            <NavLink to="/pos/revenue">Doanh thu</NavLink>
            <NavLink to="/pos/tickets">Soát vé</NavLink>
          </>
        )}
        {user?.role === "ADMIN" && (
          <>
            <NavLink to="/admin/genres">Thể loại</NavLink>
            <NavLink to="/admin/movies">Phim</NavLink>
            <NavLink to="/admin/showtimes">Suất chiếu</NavLink>
            <NavLink to="/admin/concessions">Đồ ăn vặt</NavLink>
            <NavLink to="/admin/reports">Báo cáo</NavLink>
            <NavLink to="/admin/settings">Cài đặt</NavLink>
          </>
        )}
      </nav>

      <div className="nav-account">
        <ThemeToggle compact />
        {!user && (
          <>
            <NavLink to="/register" className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Đăng ký</NavLink>
            <NavLink to="/login" className="btn-pill">Thành viên</NavLink>
          </>
        )}
        {user && (
          <>
            <span className="nav-user">{user.username}</span>
            <button
              className="btn-pill"
              onClick={async () => {
                await abandon();
                logout();
                nav(user.role === "CASHIER" ? "/pos/login" : "/");
              }}
            >
              Thoát
            </button>
          </>
        )}
      </div>
    </header>
  );
}
