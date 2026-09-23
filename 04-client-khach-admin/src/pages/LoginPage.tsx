import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { useBrand } from "../context/BrandContext";
import { assetUrl } from "../lib/assetUrl";

export default function LoginPage({ pos = false }: { pos?: boolean }) {
  const { login } = useAuth();
  const { name, imageUrl } = useBrand();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [username, setUsername] = useState(pos ? "NhanVien" : "");
  const [password, setPassword] = useState(pos ? "NhanVien123" : "");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const u = await login(username, password);
      if (pos && u.role !== "CASHIER") {
        setErr("Tài khoản không phải thu ngân");
        return;
      }
      if (u.role === "ADMIN") nav("/admin/movies");
      else if (u.role === "CASHIER") nav("/pos");
      else nav(loc.state?.from || "/");
    } catch {
      setErr("Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <div
      className="page login-page"
      style={{
        maxWidth: 420,
        ...(imageUrl
          ? {
              maxWidth: "none",
              minHeight: "70vh",
              backgroundImage: `linear-gradient(rgba(5,2,8,.72), rgba(5,2,8,.78)), url(${assetUrl(imageUrl)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }
          : {}),
      }}
    >
      <div className="panel" style={{ maxWidth: 420, width: "100%" }}>
        <h2>{pos ? `Đăng nhập POS · ${name}` : `Đăng nhập · ${name}`}</h2>
        {err && <div className="toast err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Tên đăng nhập</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-yellow" type="submit" style={{ width: "100%" }}>Đăng nhập</button>
        </form>
        {!pos && (
          <p className="muted" style={{ marginTop: 16 }}>
            Chưa có tài khoản? <Link to="/register">Đăng ký thành viên</Link>
            <br />Thu ngân? <Link to="/pos/login">Vào POS</Link>
            <br />Admin đăng nhập tại đây bằng tài khoản <code>admin</code>.
          </p>
        )}
      </div>
    </div>
  );
}
