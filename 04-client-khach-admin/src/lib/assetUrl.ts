export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function assetUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}/${path.replace(/^\//, "")}`;
}
