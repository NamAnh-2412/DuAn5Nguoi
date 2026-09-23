import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await register(username, password);
      await login(username, password);
      nav("/");
    } catch {
      setErr("Không đăng ký được (username trùng hoặc mật khẩu ngắn)");
    }
  };

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <div className="panel">
        <h2>Đăng ký khách</h2>
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
          <button className="btn btn-yellow" type="submit">Tạo tài khoản</button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}><Link to="/login">Đã có tài khoản</Link></p>
      </div>
    </div>
  );
}
