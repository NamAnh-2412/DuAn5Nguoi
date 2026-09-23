import api from "./client";
import type { CinemaSettings, ConcessionProduct, Movie, Page, Room, Showtime } from "./types";

export async function fetchMovies(params: {
  name?: string;
  status?: string;
  genreId?: number;
  page?: number;
  size?: number;
  sort?: string;
}) {
  const { data } = await api.get<Page<Movie>>("/api/movies", { params });
  return data;
}

export type MoviePayload = {
  title: string;
  durationMinutes: number;
  rated: string;
  description?: string;
  status: string;
  genre: { id: number };
  trailerUrl?: string;
  director?: string;
  castNames?: string;
  releaseDate?: string | null;
};

export async function createMovie(body: MoviePayload) {
  const { data } = await api.post<Movie>("/api/movies", body);
  return data;
}

export async function updateMovie(id: number, body: MoviePayload) {
  const { data } = await api.put<Movie>(`/api/movies/${id}`, body);
  return data;
}

export async function hideMovie(id: number) {
  await api.delete(`/api/movies/${id}`);
}

export async function uploadMoviePoster(id: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ posterUrl: string }>(`/api/movies/${id}/upload-poster`, form);
  return data;
}

export async function fetchMovie(id: number) {
  const { data } = await api.get<Movie>(`/api/movies/${id}`);
  return data;
}

export async function fetchShowtimes(
  movieId?: number,
  date?: string,
  opts?: { includePast?: boolean },
) {
  const { data } = await api.get<Showtime[]>("/api/showtimes", {
    params: { movieId, date, includePast: opts?.includePast ? true : undefined },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchRooms() {
  const { data } = await api.get<Room[]>("/api/rooms");
  return data;
}

export type RoomPayload = {
  name: string;
  rowCount: number;
  seatsPerRow: number;
  vipRowCount: number;
};

export async function createRoom(body: RoomPayload) {
  const { data } = await api.post<Room>("/api/rooms", body);
  return data;
}

export async function updateRoom(id: number, body: { name?: string; status?: string }) {
  const { data } = await api.put<Room>(`/api/rooms/${id}`, body);
  return data;
}

export type ShowtimePayload = {
  movieId: number;
  roomId: number;
  startAt: string;
  basePrice: number;
};

export async function createShowtime(body: ShowtimePayload) {
  const { data } = await api.post<Showtime>("/api/showtimes", body);
  return data;
}

export async function updateShowtime(id: number, body: ShowtimePayload) {
  const { data } = await api.put<Showtime>(`/api/showtimes/${id}`, body);
  return data;
}

export async function cancelShowtime(id: number) {
  await api.delete(`/api/showtimes/${id}`);
}

export async function fetchGenres() {
  const { data } = await api.get<{ id: number; name: string; movieCount?: number }[]>("/api/genres");
  return data;
}

export async function fetchGenreMovies(genreId: number) {
  const { data } = await api.get<Movie[]>(`/api/genres/${genreId}/movies`);
  return data;
}

export async function fetchConcessions() {
  const { data } = await api.get<ConcessionProduct[]>("/api/concessions");
  return data;
}

export async function createConcession(body: { name: string; price: number; type: string; status?: string }) {
  const { data } = await api.post<ConcessionProduct>("/api/concessions", body);
  return data;
}

export async function updateConcession(
  id: number,
  body: { name: string; price: number; type: string; status: string },
) {
  const { data } = await api.put<ConcessionProduct>(`/api/concessions/${id}`, body);
  return data;
}

export async function fetchSettings() {
  const { data } = await api.get<CinemaSettings>("/api/settings");
  return data;
}

export async function updateCinemaName(name: string) {
  const { data } = await api.put<CinemaSettings>("/api/settings", { name });
  return data;
}

export async function uploadCinemaLogo(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<CinemaSettings>("/api/settings/logo", form);
  return data;
}

export async function uploadCinemaImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<CinemaSettings>("/api/settings/image", form);
  return data;
}
