import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../api/types";
import type { ReactNode } from "react";

export default function Protected({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    const pos = roles.length === 1 && roles[0] === "CASHIER";
    return <Navigate to={pos ? "/pos/login" : "/login"} replace />;
  }
  if (!roles.includes(user.role)) {
    if (user.role === "CASHIER") return <Navigate to="/pos" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin/movies" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}
