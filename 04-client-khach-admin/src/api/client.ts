import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vx_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  const writeCatalog =
    ["post", "put", "delete"].includes(method) &&
    (url.includes("/api/genres") || url.includes("/api/movies") || url.includes("/api/showtimes") || url.includes("/api/rooms") || url.includes("/api/concessions") || url.includes("/api/settings"));
  if (writeCatalog) {
    config.headers["X-API-KEY"] = import.meta.env.VITE_API_KEY || "SECRET_KEY_BTL";
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || "";
      if (!url.includes("/api/auth/login")) {
        localStorage.removeItem("vx_token");
        localStorage.removeItem("vx_user");
        if (!window.location.pathname.includes("/login")) {
          const pos = window.location.pathname.startsWith("/pos");
          window.location.href = pos ? "/pos/login" : "/login";
        }
      }
    }
    return Promise.reject(err);
  },
);

export default api;
