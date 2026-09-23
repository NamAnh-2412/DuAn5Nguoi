export type Role = "ADMIN" | "CASHIER" | "CUSTOMER";

export type AuthUser = {
  token: string;
  userId: number;
  username: string;
  role: Role;
};

export type Movie = {
  id: number;
  title: string;
  durationMinutes: number;
  rated: string;
  posterUrl?: string;
  genreId?: number;
  genreName?: string;
  status: string;
  description?: string;
  trailerUrl?: string;
  director?: string;
  castNames?: string;
  releaseDate?: string;
  favoriteCount?: number;
};

export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

export type Room = {
  id: number;
  name: string;
  rowCount: number;
  seatsPerRow: number;
  status?: string;
};

export type Showtime = {
  id: number;
  movieId: number;
  movieTitle: string;
  roomId: number;
  roomName: string;
  startAt: string;
  endAt: string;
  basePrice: number;
  status?: string;
  hold?: number | null;
  booked?: number | null;
  capacity?: number | null;
};

export type SeatCell = {
  seatId: number;
  label: string;
  row: string;
  number: number;
  type: string;
  status: "AVAILABLE" | "HOLD" | "HOLD_MINE" | "BOOKED";
  price: number;
};

export type SeatMap = {
  showtimeId: number;
  movieTitle: string;
  startAt: string;
  roomName: string;
  holdMinutes: number;
  seats: SeatCell[];
};

export type HoldResponse = {
  reservationId: number;
  status: string;
  holdExpiresAt: string;
  totalAmount: number;
  seats: { seatId: number; label: string; price: number }[];
};

export type Reservation = {
  id: number;
  showtimeId?: number;
  status: string;
  channel: string;
  movieTitle: string;
  startAt: string;
  roomName: string;
  guestName?: string;
  seatsSubtotal?: number;
  concessionsSubtotal?: number;
  totalAmount: number;
  holdExpiresAt?: string;
  tickets: { ticketCode: string; seatLabel: string; qrPayload: string }[];
  seatLabels: string[];
  concessions?: { productId: number; name: string; unitPrice: number; qty: number; lineTotal: number }[];
};

export type ConcessionProduct = {
  id: number;
  name: string;
  price: number;
  type: string;
  status: string;
};

export type RevenueMoney = {
  ticket: number;
  concession: number;
  total: number;
  ticketsSold: number;
};

export type RevenueReport = {
  today: RevenueMoney;
  week: RevenueMoney;
  month: RevenueMoney;
  range: { from: string; to: string; grain: string; totals: RevenueMoney };
  series: { label: string; date: string; ticket: number; concession: number; total: number }[];
  topMovies: { movieId: number; movieTitle: string; tickets: number; revenue: number }[];
  topConcessions: { productId: number; name: string; qty: number; revenue: number }[];
  byChannel: { online: RevenueMoney; pos: RevenueMoney };
};

export type CinemaSettings = {
  name: string;
  logoUrl?: string | null;
  imageUrl?: string | null;
};
