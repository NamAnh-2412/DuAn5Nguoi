import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelShowtime,
  createRoom,
  createShowtime,
  fetchMovies,
  fetchRooms,
  fetchShowtimes,
  updateRoom,
  updateShowtime,
} from "../../api/catalogApi";
import type { Room, Showtime } from "../../api/types";

function isActive(r: Room) {
  return !r.status || r.status === "ACTIVE";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `${today()}T18:00`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toApiDateTime(local: string) {
  return local.length === 16 ? `${local}:00` : local;
}

function hm(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) && iso.includes("T")) return iso.slice(11, 16);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function expectedEnd(startLocal: string, durationMinutes: number) {
  const raw = toApiDateTime(startLocal);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  d.setMinutes(d.getMinutes() + durationMinutes + 15);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isPast(startAt: string) {
  return new Date(startAt).getTime() <= Date.now();
}

function vnd(n: number) {
  return `${Number(n).toLocaleString("vi-VN")}đ`;
}

function apiMessage(e: unknown, fallback: string) {
  const res = (e as { response?: { status?: number; data?: { message?: string } } }).response;
  if (res?.data?.message) return res.data.message;
  if (res?.status === 403) return "Không có quyền. Đăng xuất rồi đăng nhập lại bằng tài khoản admin.";
  if (res?.status === 401) return "Phiên đăng nhập hết hạn. Hãy đăng nhập lại.";
  if (res?.status === 405) return "API chưa nạp chức năng tạo phòng. Restart API rồi thử lại.";
  return e instanceof Error && !e.message.startsWith("Request failed") ? e.message : fallback;
}

export default function ShowtimeAdminPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(today);
  const [movieId, setMovieId] = useState<number>();
  const [roomId, setRoomId] = useState<number>();
  const [startAt, setStartAt] = useState(`${today()}T18:00`);
  const [price, setPrice] = useState(80000);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [roomName, setRoomName] = useState("");
  const [rowCount, setRowCount] = useState(8);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [vipRowCount, setVipRowCount] = useState(2);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");

  const moviesQ = useQuery({
    queryKey: ["admin-showing-movies"],
    queryFn: () => fetchMovies({ status: "SHOWING", size: 50, sort: "title,asc" }),
  });
  const roomsQ = useQuery({ queryKey: ["rooms"], queryFn: fetchRooms });
  const showsQ = useQuery({
    queryKey: ["admin-showtimes", date],
    queryFn: () => fetchShowtimes(undefined, date, { includePast: true }),
  });

  const movies = moviesQ.data?.content ?? [];
  const rooms = roomsQ.data ?? [];
  const shows = showsQ.data ?? [];
  const activeRooms = rooms.filter(isActive);

  useEffect(() => {
    if (movieId == null && movies[0]) setMovieId(movies[0].id);
  }, [movieId, movies]);

  useEffect(() => {
    const current = rooms.find((r) => r.id === roomId);
    if (current && isActive(current)) return;
    const next = rooms.find(isActive);
    if (next) setRoomId(next.id);
  }, [roomId, rooms]);

  useEffect(() => {
    if (editingId != null) return;
    setStartAt((prev) => `${date}T${prev.slice(11, 16) || "18:00"}`);
  }, [date, editingId]);

  const movie = movies.find((m) => m.id === movieId);
  const endPreview = movie ? expectedEnd(startAt, movie.durationMinutes) : "—";

  const bookedSeats = shows.reduce((sum, s) => sum + (s.booked ?? 0), 0);
  const byRoom = useMemo(() => {
    const map = new Map<number, Showtime[]>();
    for (const s of shows) {
      const list = map.get(s.roomId) ?? [];
      list.push(s);
      map.set(s.roomId, list);
    }
    return map;
  }, [shows]);

  const resetForm = () => {
    setEditingId(null);
    setPrice(80000);
    setStartAt(`${date}T18:00`);
    if (movies[0]) setMovieId(movies[0].id);
    if (activeRooms[0]) setRoomId(activeRooms[0].id);
  };

  const fillEdit = (s: Showtime) => {
    setErr("");
    setEditingId(s.id);
    setMovieId(s.movieId);
    setRoomId(s.roomId);
    setStartAt(toLocalInput(s.startAt));
    setPrice(Number(s.basePrice));
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!movieId || !roomId) throw new Error("Chọn phim và phòng");
      if (isPast(toApiDateTime(startAt))) throw new Error("Giờ bắt đầu phải ở tương lai");
      const body = {
        movieId,
        roomId,
        startAt: toApiDateTime(startAt),
        basePrice: price,
      };
      if (editingId != null) await updateShowtime(editingId, body);
      else await createShowtime(body);
    },
    onSuccess: () => {
      setErr("");
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-showtimes"] });
    },
    onError: (e: unknown) => setErr(apiMessage(e, "Không lưu được suất")),
  });

  const roomPatchMut = useMutation({
    mutationFn: (args: { id: number; name?: string; status?: string }) =>
      updateRoom(args.id, { name: args.name, status: args.status }),
    onSuccess: () => {
      setErr("");
      setRenamingId(null);
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: unknown) => setErr(apiMessage(e, "Không cập nhật được phòng")),
  });

  const roomMut = useMutation({
    mutationFn: () => {
      const name = roomName.trim();
      if (!name) throw new Error("Nhập tên phòng");
      if (vipRowCount > rowCount) throw new Error("Số hàng VIP không được lớn hơn số hàng");
      return createRoom({ name, rowCount, seatsPerRow, vipRowCount });
    },
    onSuccess: (room) => {
      setErr("");
      setRoomName("");
      setRoomId(room.id);
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: unknown) => setErr(apiMessage(e, "Không tạo được phòng")),
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelShowtime(id),
    onSuccess: (_, id) => {
      setErr("");
      if (editingId === id) resetForm();
      qc.invalidateQueries({ queryKey: ["admin-showtimes"] });
    },
    onError: (e: unknown) => setErr(apiMessage(e, "Không hủy được suất")),
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Suất chiếu</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Lịch <strong className="text-zinc-200">một ngày theo phòng</strong>. Suất xám đã bắt đầu — không sửa/hủy.
        Đã bán hoặc đang giữ ghế thì khóa. Phòng dừng: không sửa, vẫn hủy nếu trống; khách không mua được.
      </p>

      {(err || showsQ.isError) && (
        <div className="mb-3 rounded-lg border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200">
          {err || apiMessage(showsQ.error, "Không tải được lịch suất")}
        </div>
      )}

      <form
        className="mb-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          roomMut.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400 lg:col-span-2">
          Tên phòng
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Phòng 3"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Số hàng
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            type="number"
            min={4}
            max={15}
            value={rowCount}
            onChange={(e) => setRowCount(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Ghế / hàng
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            type="number"
            min={6}
            max={16}
            value={seatsPerRow}
            onChange={(e) => setSeatsPerRow(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Hàng VIP cuối
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            type="number"
            min={0}
            max={15}
            value={vipRowCount}
            onChange={(e) => setVipRowCount(Number(e.target.value))}
          />
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-900 hover:bg-yellow-300"
            disabled={roomMut.isPending}
          >
            Thêm phòng
          </button>
          <span className="ml-3 text-xs text-zinc-500">
            Tạo xong dùng ngay. Đổi tên / Dừng / Dùng trên từng khối phòng. Không xóa, không sửa lưới.
          </span>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Ngày
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
          {shows.length} suất
        </span>
        <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
          {bookedSeats} ghế đã bán
        </span>
      </div>

      <form
        className="mb-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400 lg:col-span-2">
          Phim
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            value={movieId ?? ""}
            onChange={(e) => setMovieId(Number(e.target.value))}
          >
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Phòng
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            value={roomId ?? ""}
            onChange={(e) => setRoomId(Number(e.target.value))}
          >
            {activeRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.rowCount * r.seatsPerRow} ghế
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400 lg:col-span-2">
          Giờ bắt đầu
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Giá (VNĐ)
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            type="number"
            min={0}
            step={1000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-6">
          <p className="mr-auto text-sm text-zinc-400">
            Kết thúc dự kiến <strong className="text-yellow-400">{endPreview}</strong>
            {movie ? ` · ${movie.durationMinutes} phút + 15 phút dọn` : ""}
          </p>
          {editingId != null && (
            <button
              type="button"
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-200"
              onClick={resetForm}
            >
              Hủy sửa
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-900 hover:bg-yellow-300"
            disabled={saveMut.isPending}
          >
            {editingId != null ? "Lưu sửa" : "Tạo suất"}
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((room) => {
          const list = byRoom.get(room.id) ?? [];
          const on = isActive(room);
          return (
            <section key={room.id} className={`overflow-hidden rounded-xl border ${on ? "border-zinc-800" : "border-zinc-800/70 opacity-75"}`}>
              <header className={`flex flex-wrap items-center gap-2 px-4 py-3 ${on ? "bg-red-950/50" : "bg-zinc-900"}`}>
                <span className={`w-14 shrink-0 text-[11px] font-extrabold uppercase tracking-wide ${on ? "text-red-400" : "text-zinc-500"}`}>
                  Phòng
                </span>
                {renamingId === room.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = renameName.trim();
                      if (!name) return;
                      roomPatchMut.mutate({ id: room.id, name });
                    }}
                  >
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-zinc-600 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="rounded-lg bg-yellow-400 px-2 py-1 text-xs font-extrabold text-zinc-900">
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-600 px-2 py-1 text-xs font-extrabold text-zinc-200"
                      onClick={() => setRenamingId(null)}
                    >
                      Hủy
                    </button>
                  </form>
                ) : (
                  <h2 className={`m-0 min-w-0 flex-1 text-base font-extrabold ${on ? "text-white" : "text-zinc-400"}`}>
                    {room.name}
                    {!on && <span className="ml-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Đã dừng</span>}
                  </h2>
                )}
                <span className="shrink-0 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-extrabold text-zinc-900">
                  {list.length} suất
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-600 px-2 py-1 text-xs font-extrabold text-zinc-100"
                  onClick={() => {
                    setRenamingId(room.id);
                    setRenameName(room.name);
                  }}
                >
                  Đổi tên
                </button>
                {on ? (
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/60 px-2 py-1 text-xs font-extrabold text-red-200"
                    disabled={roomPatchMut.isPending}
                    onClick={() => {
                      if (window.confirm(`Dừng “${room.name}”? Không tạo suất mới và không bán vé các suất còn lại.`)) {
                        roomPatchMut.mutate({ id: room.id, status: "INACTIVE" });
                      }
                    }}
                  >
                    Dừng
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-lg bg-yellow-400 px-2 py-1 text-xs font-extrabold text-zinc-900"
                    disabled={roomPatchMut.isPending}
                    onClick={() => roomPatchMut.mutate({ id: room.id, status: "ACTIVE" })}
                  >
                    Dùng
                  </button>
                )}
              </header>
              <div className="space-y-2 bg-black/35 px-4 py-3">
                {list.length === 0 && (
                  <p className="m-0 text-sm text-zinc-500">Chưa có suất ngày này.</p>
                )}
                {list.map((s) => {
                  const past = isPast(s.startAt);
                  const sold = (s.booked ?? 0) > 0;
                  const holding = (s.hold ?? 0) > 0;
                  const occupied = sold || holding;
                  const editLocked = past || occupied || !on;
                  const cancelLocked = past || occupied;
                  const cap = s.capacity ?? room.rowCount * room.seatsPerRow;
                  return (
                    <article
                      key={s.id}
                      className={`rounded-lg border px-3 py-3 ${
                        past
                          ? "border-zinc-800 bg-zinc-950/40 text-zinc-500"
                          : editingId === s.id
                            ? "border-yellow-400/50 bg-zinc-950"
                            : "border-zinc-800 bg-zinc-950/80"
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-extrabold ${past ? "text-zinc-500" : "text-yellow-400"}`}>
                            {hm(s.startAt)} – {hm(s.endAt)}
                          </div>
                          <div className={`font-semibold ${past ? "text-zinc-500" : "text-zinc-100"}`}>{s.movieTitle}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {vnd(s.basePrice)} · giữ {s.hold ?? 0} / bán {s.booked ?? 0} / {cap} ghế
                            {past ? " · đã bắt đầu" : ""}
                            {sold ? " · đã bán vé" : ""}
                            {holding ? " · đang giữ ghế" : ""}
                            {!on ? " · phòng đã dừng" : ""}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-extrabold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={editLocked}
                            onClick={() => fillEdit(s)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-500/60 px-3 py-1.5 text-xs font-extrabold text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={cancelLocked || cancelMut.isPending}
                            onClick={() => {
                              if (window.confirm(`Hủy suất ${hm(s.startAt)} · ${s.movieTitle}?`)) {
                                cancelMut.mutate(s.id);
                              }
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
        {roomsQ.isLoading && <p className="text-sm text-zinc-500">Đang tải phòng...</p>}
        {roomsQ.isSuccess && rooms.length === 0 && (
          <p className="text-sm text-zinc-500">Chưa có phòng. Cần seed phòng trước khi tạo suất.</p>
        )}
      </div>
    </div>
  );
}
