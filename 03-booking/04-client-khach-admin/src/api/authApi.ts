import api from "./client";
import type { AuthUser } from "./types";

export async function login(username: string, password: string) {
  const { data } = await api.post<AuthUser>("/api/auth/login", { username, password });
  return data;
}

export async function register(username: string, password: string) {
  const { data } = await api.post("/api/auth/register", { username, password });
  return data;
}
