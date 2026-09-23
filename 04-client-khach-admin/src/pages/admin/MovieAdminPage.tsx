import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMovie,
  fetchGenres,
  fetchMovie,
  fetchMovies,
  hideMovie,
  updateMovie,
  uploadMoviePoster,
} from "../../api/catalogApi";
import type { Movie } from "../../api/types";
import { youtubeEmbedSrc, youtubeId } from "../../lib/youtube";

const MAX_POSTER_BYTES = 5 * 1024 * 1024;
const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const schema = z.object({
  title: z.string().trim().min(1, "Nhập tên phim"),
  durationMinutes: z.coerce.number().min(1, "Thời lượng phải > 0"),
  rated: z.string().min(1),
  genreId: z.coerce.number(),
  status: z.enum(["SHOWING", "COMING", "HIDDEN"]),
  description: z.string().optional(),
  trailerUrl: z.string().optional(),
  director: z.string().optional(),
  castNames: z.string().optional(),
  releaseDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_LABEL: Record<string, string> = {
  SHOWING: "Đang chiếu",
  COMING: "Sắp chiếu",
  HIDDEN: "Ngừng chiếu",
};

export default function MovieAdminPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [genreId, setGenreId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("title,asc");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterErr, setPosterErr] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [formErr, setFormErr] = useState("");

  const moviesQ = useQuery({
    queryKey: ["admin-movies", name, genreId, status, page, sort],
    queryFn: () => fetchMovies({
      name,
      status,
      page,
      size: 8,
      sort,
      genreId: genreId === "ALL" ? undefined : Number(genreId),
    }),
  });
  const genresQ = useQuery({ queryKey: ["genres"], queryFn: fetchGenres });
  const detailQ = useQuery({
    queryKey: ["movie", editingId],
    queryFn: () => fetchMovie(editingId!),
    enabled: editingId != null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      durationMinutes: 120,
      rated: "C13",
      genreId: 0,
      status: "SHOWING",
      description: "",
      trailerUrl: "",
      director: "",
      castNames: "",
      releaseDate: "",
    },
  });

  useEffect(() => {
    if (genresQ.data?.[0] && !form.getValues("genreId")) {
      form.setValue("genreId", genresQ.data[0].id);
    }
  }, [genresQ.data, form]);

  useEffect(() => {
    const m = detailQ.data;
    if (!m || editingId == null) return;
    form.reset({
      title: m.title,
      durationMinutes: m.durationMinutes,
      rated: m.rated || "C13",
      genreId: m.genreId || genresQ.data?.[0]?.id || 0,
      status: (m.status as FormValues["status"]) || "SHOWING",
      description: m.description || "",
      trailerUrl: m.trailerUrl || "",
      director: m.director || "",
      castNames: m.castNames || "",
      releaseDate: m.releaseDate || "",
    });
  }, [detailQ.data, editingId, form, genresQ.data]);

  const saveMut = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        title: values.title,
        durationMinutes: values.durationMinutes,
        rated: values.rated,
        description: values.description,
        status: values.status,
        genre: { id: values.genreId },
        trailerUrl: values.trailerUrl,
        director: values.director,
        castNames: values.castNames,
        releaseDate: values.releaseDate || null,
      };
      const saved = editingId
        ? await updateMovie(editingId, body)
        : await createMovie(body);
      if (posterFile) {
        await uploadMoviePoster(saved.id, posterFile);
      }
      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-movies"] });
      closeForm();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setFormErr(msg || "Không lưu được phim");
    },
  });

  const hideMut = useMutation({
    mutationFn: hideMovie,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-movies"] }),
  });

  const pickPoster = (file: File | undefined) => {
    if (!file) return;
    if (!POSTER_TYPES.includes(file.type)) {
      setPosterErr("Chỉ nhận JPG, PNG, WEBP, GIF");
      return;
    }
    if (file.size > MAX_POSTER_BYTES) {
      setPosterErr("Ảnh tối đa 5MB");
      return;
    }
    setPosterErr("");
    setPosterFile(file);
  };

  const localPreview = useMemo(() => (posterFile ? URL.createObjectURL(posterFile) : ""), [posterFile]);
  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const existingPoster = editingId && detailQ.data?.posterUrl ? `${API}/${detailQ.data.posterUrl}` : "";
  const posterSrc = localPreview || existingPoster;
  const trailerPreviewId = youtubeId(form.watch("trailerUrl"));

  const closeForm = () => {
    setOpen(false);
    setEditingId(null);
    setPosterFile(null);
    setPosterErr("");
    setFormErr("");
    form.reset();
  };

  const openCreate = () => {
    setEditingId(null);
    setPosterFile(null);
    setPosterErr("");
    setFormErr("");
    form.reset({
      title: "",
      durationMinutes: 120,
      rated: "C13",
      genreId: genresQ.data?.[0]?.id || 0,
      status: "SHOWING",
      description: "",
      trailerUrl: "",
      director: "",
      castNames: "",
      releaseDate: "",
    });
    setOpen(true);
  };

  const openEdit = (m: Movie) => {
    setEditingId(m.id);
    setPosterFile(null);
    setPosterErr("");
    setFormErr("");
    setOpen(true);
  };

  const rows = moviesQ.data?.content ?? [];
  const totalPages = moviesQ.data?.totalPages ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Quản lý phim</h1>
          <p className="text-sm text-zinc-400">CRUD catalog · JWT ADMIN + API Key khi ghi</p>
        </div>
        <button
          className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-900 hover:bg-yellow-300"
          onClick={openCreate}
        >
          Thêm phim
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          placeholder="Tìm theo tên..."
          value={name}
          onChange={(e) => { setName(e.target.value); setPage(0); }}
        />
        <select
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          value={genreId}
          onChange={(e) => { setGenreId(e.target.value); setPage(0); }}
        >
          <option value="ALL">Mọi thể loại</option>
          {genresQ.data?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="SHOWING">Đang chiếu</option>
          <option value="COMING">Sắp chiếu</option>
          <option value="HIDDEN">Ngừng chiếu</option>
        </select>
        <select
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="title,asc">Tên A-Z</option>
          <option value="title,desc">Tên Z-A</option>
          <option value="durationMinutes,desc">Thời lượng ↓</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-3 py-3 font-semibold">Poster</th>
              <th className="px-3 py-3 font-semibold">Phim</th>
              <th className="px-3 py-3 font-semibold">Thể loại</th>
              <th className="px-3 py-3 font-semibold">Thời lượng</th>
              <th className="px-3 py-3 font-semibold">Trạng thái</th>
              <th className="px-3 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {moviesQ.isLoading && (
              <tr><td className="px-3 py-6 text-zinc-500" colSpan={6}>Đang tải...</td></tr>
            )}
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-zinc-800">
                <td className="px-3 py-2">
                  {m.posterUrl
                    ? <img src={`${API}/${m.posterUrl}`} alt="" className="h-14 w-10 rounded object-cover" />
                    : <div className="flex h-14 w-10 items-center justify-center rounded bg-zinc-800 text-[10px]">—</div>}
                </td>
                <td className="px-3 py-2">
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-xs text-zinc-500">{m.rated}{m.director ? ` · ${m.director}` : ""}</div>
                </td>
                <td className="px-3 py-2">{m.genreName}</td>
                <td className="px-3 py-2">{m.durationMinutes} phút</td>
                <td className="px-3 py-2">{STATUS_LABEL[m.status] || m.status}</td>
                <td className="px-3 py-2 text-right">
                  <Link className="mr-2 font-semibold text-zinc-200 hover:text-white" to={`/movies/${m.id}`}>Xem</Link>
                  <button className="mr-2 font-semibold text-yellow-400" onClick={() => openEdit(m)}>Sửa</button>
                  {m.status !== "HIDDEN" && (
                    <button className="font-semibold text-red-400" onClick={() => hideMut.mutate(m.id)}>Ngừng</button>
                  )}
                </td>
              </tr>
            ))}
            {!moviesQ.isLoading && rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-zinc-500" colSpan={6}>
                  {name || genreId !== "ALL" ? "Không tìm thấy phim phù hợp." : "Chưa có phim."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`rounded-lg px-3 py-1 text-sm font-bold ${i === page ? "bg-yellow-400 text-zinc-900" : "bg-zinc-800"}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 p-4">
          <form
            className="my-8 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            onSubmit={form.handleSubmit((v) => saveMut.mutate(v))}
          >
            <h2 className="mb-4 text-xl font-extrabold">{editingId ? "Sửa phim" : "Thêm phim"}</h2>
            {formErr && <div className="mb-3 rounded-lg border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200">{formErr}</div>}
            <label className="mb-3 block text-sm">
              Tên phim
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("title")} />
              {form.formState.errors.title && <span className="text-red-400">{form.formState.errors.title.message}</span>}
            </label>
            <div className="mb-4">
              <div className="mb-1 text-sm">Ảnh poster</div>
              <div
                className={`flex gap-4 rounded-xl border border-dashed p-3 ${dragOver ? "border-yellow-400 bg-zinc-800" : "border-zinc-600 bg-zinc-950"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pickPoster(e.dataTransfer.files[0]);
                }}
              >
                <div className="h-40 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {posterSrc
                    ? <img src={posterSrc} alt="Poster" className="h-full w-full object-cover" />
                    : <div className="grid h-full place-items-center px-2 text-center text-xs text-zinc-500">Chưa có ảnh</div>}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                  <p className="text-sm text-zinc-300">Kéo ảnh vào đây hoặc bấm chọn file</p>
                  <p className="text-xs text-zinc-500">JPG / PNG / WEBP / GIF · tối đa 5MB · tỉ lệ dọc 2:3 đẹp nhất trên thẻ phim</p>
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-bold text-zinc-900 hover:bg-yellow-300">
                      Chọn ảnh
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          pickPoster(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {posterFile && (
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm"
                        onClick={() => { setPosterFile(null); setPosterErr(""); }}
                      >
                        Bỏ ảnh vừa chọn
                      </button>
                    )}
                  </div>
                  {posterFile && <p className="truncate text-xs text-zinc-400">{posterFile.name}</p>}
                  {posterErr && <p className="text-sm text-red-400">{posterErr}</p>}
                </div>
              </div>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="text-sm">Thời lượng (phút)
                <input type="number" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("durationMinutes")} />
              </label>
              <label className="text-sm">Rated
                <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("rated")}>
                  <option>P</option><option>C13</option><option>C16</option><option>C18</option>
                </select>
              </label>
              <label className="text-sm">Thể loại
                <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("genreId")}>
                  {genresQ.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>
              <label className="text-sm">Trạng thái
                <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("status")}>
                  <option value="SHOWING">Đang chiếu</option>
                  <option value="COMING">Sắp chiếu</option>
                  <option value="HIDDEN">Ngừng chiếu</option>
                </select>
              </label>
            </div>
            <label className="mb-3 block text-sm">Đạo diễn
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("director")} />
            </label>
            <label className="mb-3 block text-sm">Diễn viên
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("castNames")} />
            </label>
            <label className="mb-3 block text-sm">Ngày khởi chiếu
              <input type="date" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("releaseDate")} />
            </label>
            <label className="mb-3 block text-sm">Trailer YouTube
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" placeholder="https://youtube.com/watch?v=..." {...form.register("trailerUrl")} />
              <span className="mt-1 block text-xs text-zinc-500">
                Dán link YouTube (watch / youtu.be / shorts). Không upload file video — trailer thường 50–200MB, vượt hạn mức 5MB của BTL.
              </span>
            </label>
            {trailerPreviewId && (
              <div className="mb-3 overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  title="Xem trước trailer"
                  src={youtubeEmbedSrc(trailerPreviewId)}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            )}
            <label className="mb-4 block text-sm">Mô tả
              <textarea rows={3} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100" {...form.register("description")} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-lg border border-zinc-700 px-4 py-2 font-semibold" onClick={closeForm}>Hủy</button>
              <button type="submit" disabled={saveMut.isPending} className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-900 disabled:opacity-50">
                {saveMut.isPending ? (posterFile ? "Đang lưu & tải ảnh..." : "Đang lưu...") : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
