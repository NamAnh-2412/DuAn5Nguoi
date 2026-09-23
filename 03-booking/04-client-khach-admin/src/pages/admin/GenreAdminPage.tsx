import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { fetchGenreMovies, fetchGenres, fetchMovies } from "../../api/catalogApi";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const STATUS_LABEL: Record<string, string> = {
  SHOWING: "Đang chiếu",
  COMING: "Sắp chiếu",
  HIDDEN: "Ngừng chiếu",
};

export default function GenreAdminPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const genresQ = useQuery({ queryKey: ["genres"], queryFn: fetchGenres });
  const catalogQ = useQuery({
    queryKey: ["genre-stats-movies"],
    queryFn: () => fetchMovies({ status: "ALL", size: 100, sort: "title,asc" }),
  });
  const moviesQ = useQuery({
    queryKey: ["genre-movies", openId],
    queryFn: () => fetchGenreMovies(openId!),
    enabled: openId != null,
  });

  const countByGenre = useMemo(() => {
    const map = new Map<number, number>();
    for (const m of catalogQ.data?.content ?? []) {
      if (m.genreId != null) map.set(m.genreId, (map.get(m.genreId) ?? 0) + 1);
    }
    return map;
  }, [catalogQ.data]);

  const addMut = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Nhập tên thể loại");
      await api.post("/api/genres", { name: trimmed });
    },
    onSuccess: () => {
      setName("");
      setErr("");
      qc.invalidateQueries({ queryKey: ["genres"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErr(msg || (e instanceof Error ? e.message : "Không thêm được"));
    },
  });

  const totalMovies = genresQ.data?.reduce((sum, g) => {
    const n = g.movieCount ?? countByGenre.get(g.id) ?? 0;
    return sum + n;
  }, 0) ?? 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Thể loại</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Dòng đỏ là <strong className="text-zinc-200">thể loại</strong>. Bấm để mở danh sách{" "}
        <strong className="text-yellow-400">phim</strong> bên trong, rồi chọn Xem chi tiết.
      </p>
      {err && <div className="mb-3 rounded-lg border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200">{err}</div>}
      <form
        className="mb-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addMut.mutate();
        }}
      >
        <input
          className="min-w-56 flex-1 rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên thể loại"
        />
        <button
          type="submit"
          className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-900 hover:bg-yellow-300"
        >
          Thêm
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          {genresQ.data?.length ?? 0} thể loại
        </span>
        <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          {totalMovies} phim đã gán
        </span>
      </div>

      <ul className="list-none space-y-2 p-0">
        {genresQ.data?.map((g) => {
          const open = openId === g.id;
          const count = g.movieCount ?? countByGenre.get(g.id) ?? 0;
          return (
            <li key={g.id} className="overflow-hidden rounded-xl border border-zinc-800">
              <button
                type="button"
                aria-expanded={open}
                className={`flex w-full items-center gap-3 border-0 px-4 py-3 text-left ${
                  open ? "bg-red-950/50" : "bg-zinc-900/70 hover:bg-zinc-900"
                }`}
                onClick={() => setOpenId(open ? null : g.id)}
              >
                <span className="w-16 shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-red-400">
                  Thể loại
                </span>
                <span className="min-w-0 flex-1 text-base font-extrabold text-white">{g.name}</span>
                <span className="shrink-0 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-extrabold text-zinc-900">
                  {count} phim
                </span>
                <span className="shrink-0 text-zinc-400" aria-hidden>{open ? "▾" : "▸"}</span>
              </button>
              {open && (
                <div className="border-t border-yellow-400/30 bg-black/35 px-4 py-3 pl-8">
                  <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-yellow-400">
                    Phim thuộc “{g.name}”
                  </div>
                  {moviesQ.isLoading && <p className="text-sm text-zinc-500">Đang tải phim...</p>}
                  {moviesQ.isError && <p className="text-sm text-red-400">Không tải được danh sách phim.</p>}
                  {moviesQ.data && moviesQ.data.length === 0 && (
                    <p className="text-sm text-zinc-500">Chưa có phim thuộc thể loại này.</p>
                  )}
                  {moviesQ.data && moviesQ.data.length > 0 && (
                    <ul className="m-0 list-none space-y-2 p-0">
                      {moviesQ.data.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2"
                        >
                          {m.posterUrl
                            ? <img src={`${API}/${m.posterUrl}`} alt="" className="h-12 w-9 rounded object-cover" />
                            : <div className="flex h-12 w-9 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-500">Phim</div>}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-zinc-100">{m.title}</div>
                            <div className="text-xs text-zinc-500">
                              {m.rated} · {m.durationMinutes} phút · {STATUS_LABEL[m.status] || m.status}
                            </div>
                          </div>
                          <Link
                            className="shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-extrabold text-zinc-900 hover:bg-yellow-300"
                            to={`/movies/${m.id}`}
                          >
                            Xem chi tiết
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {genresQ.data?.length === 0 && (
          <li className="rounded-xl border border-zinc-800 px-4 py-3 text-zinc-500">Chưa có thể loại.</li>
        )}
      </ul>
    </div>
  );
}
