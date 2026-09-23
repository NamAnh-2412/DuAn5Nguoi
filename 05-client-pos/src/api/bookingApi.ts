import api from "./client";
import type { HoldResponse, Reservation, RevenueReport, SeatMap } from "./types";

export async function fetchSeatMap(showtimeId: number) {
  const { data } = await api.get<SeatMap>(`/api/bookings/showtimes/${showtimeId}/seat-map`);
  return data;
}

export async function holdSeats(body: {
  showtimeId: number;
  seatIds: number[];
  channel: "ONLINE" | "POS";
  guestName?: string;
}) {
  const { data } = await api.post<HoldResponse>("/api/bookings/hold", body);
  return data;
}

export async function confirmOnline(id: number) {
  const { data } = await api.post<Reservation>(`/api/bookings/${id}/confirm`, {
    paymentMethod: "ONLINE_MOCK",
  });
  return data;
}

export async function confirmCash(id: number) {
  const { data } = await api.post<Reservation>(`/api/pos/bookings/${id}/confirm-cash`, {});
  return data;
}

export async function cancelHold(id: number) {
  await api.delete(`/api/bookings/${id}`);
}

export async function myTickets() {
  const { data } = await api.get<Reservation[]>("/api/bookings/my");
  return data;
}

export async function getBooking(id: number) {
  const { data } = await api.get<Reservation>(`/api/bookings/${id}`);
  return data;
}

export async function setBookingConcessions(id: number, items: { productId: number; qty: number }[]) {
  const { data } = await api.put<Reservation>(`/api/bookings/${id}/concessions`, { items });
  return data;
}

export async function fetchRevenueReport(params?: { from?: string; to?: string; grain?: string }) {
  const { data } = await api.get<RevenueReport>("/api/reports/revenue", { params });
  return data;
}

export type TicketLookup = {
  reservationId: number;
  ticketCode: string;
  movieTitle: string;
  roomName: string;
  startAt: string;
  seatLabel: string;
  status: string;
  checkedInAt?: string | null;
};

export async function lookupTicket(code: string) {
  const { data } = await api.get<TicketLookup>(`/api/tickets/${encodeURIComponent(code)}`);
  return data;
}

export async function checkInTicket(code: string) {
  const { data } = await api.post<TicketLookup>(`/api/tickets/${encodeURIComponent(code)}/check-in`);
  return data;
}
