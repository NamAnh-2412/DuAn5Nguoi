import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateCinemaName, uploadCinemaImage, uploadCinemaLogo } from "../../api/catalogApi";
import { assetUrl } from "../../lib/assetUrl";
import ThemeToggle from "../../components/ThemeToggle";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function SettingsAdminPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (q.data?.name) setName(q.data.name);
  }, [q.data?.name]);

  const saveName = useMutation({
    mutationFn: () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Nhập tên rạp");
      return updateCinemaName(trimmed);
    },
    onSuccess: (data) => {
      setErr("");
      qc.setQueryData(["settings"], data);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErr(msg || (e instanceof Error ? e.message : "Không lưu được tên rạp"));
    },
  });

  const upload = async (kind: "logo" | "image", file: File) => {
    setErr("");
    if (!TYPES.includes(file.type)) {
      setErr("Chỉ nhận JPG, PNG, WEBP, GIF");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("Ảnh tối đa 5MB");
      return;
    }
    try {
      const data = kind === "logo" ? await uploadCinemaLogo(file) : await uploadCinemaImage(file);
      qc.setQueryData(["settings"], data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErr(msg || "Không tải được ảnh");
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Cài đặt</h1>
      <p className="mb-6 text-sm text-zinc-400">Tên rạp, logo và ảnh hiện trên trang khách. Nền sáng/tối lưu trên máy này.</p>
      {err && <div className="mb-3 rounded-lg border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200">{err}</div>}

      <form
        className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveName.mutate();
        }}
      >
        <h2 className="mt-0 text-base font-extrabold">Tên rạp</h2>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Tên hiển thị
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={128}
          />
        </label>
        <button type="submit" className="mt-3 rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-900 hover:bg-yellow-300" disabled={saveName.isPending}>
          Lưu tên
        </button>
      </form>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="mt-0 text-base font-extrabold">Logo rạp</h2>
          <p className="mb-3 text-xs text-zinc-500">Chọn ảnh là lưu ngay. Vuông, tối đa 5MB.</p>
          <div className="mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
            {q.data?.logoUrl ? (
              <img src={assetUrl(q.data.logoUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-zinc-500">Chưa có</span>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload("logo", file);
            }}
          />
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="mt-0 text-base font-extrabold">Ảnh rạp</h2>
          <p className="mb-3 text-xs text-zinc-500">Nền trang chủ và đăng nhập. Ngang, tối đa 5MB.</p>
          <div className="mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
            {q.data?.imageUrl ? (
              <img src={assetUrl(q.data.imageUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-zinc-500">Chưa có</span>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload("image", file);
            }}
          />
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="mt-0 text-base font-extrabold">Giao diện</h2>
        <p className="mb-3 text-xs text-zinc-500">Nền sáng hoặc tối trên trình duyệt này.</p>
        <ThemeToggle />
      </section>
    </div>
  );
}
