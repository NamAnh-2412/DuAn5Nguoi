import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createConcession, fetchConcessions, updateConcession } from "../../api/catalogApi";
import type { ConcessionProduct } from "../../api/types";

const TYPES = [
  { id: "FOOD", label: "Đồ ăn" },
  { id: "DRINK", label: "Nước" },
  { id: "COMBO", label: "Combo" },
];

function vnd(n: number) {
  return `${Number(n).toLocaleString("vi-VN")}đ`;
}

export default function ConcessionAdminPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState(45000);
  const [type, setType] = useState("FOOD");
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<ConcessionProduct | null>(null);

  const listQ = useQuery({ queryKey: ["admin-concessions"], queryFn: fetchConcessions });

  const saveMut = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Nhập tên món");
      if (price < 0) throw new Error("Giá không hợp lệ");
      if (editing) {
        await updateConcession(editing.id, { name: trimmed, price, type, status: editing.status });
      } else {
        await createConcession({ name: trimmed, price, type, status: "ACTIVE" });
      }
    },
    onSuccess: () => {
      setErr("");
      setName("");
      setPrice(45000);
      setType("FOOD");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-concessions"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErr(msg || (e instanceof Error ? e.message : "Không lưu được món"));
    },
  });

  const statusMut = useMutation({
    mutationFn: (p: ConcessionProduct) =>
      updateConcession(p.id, {
        name: p.name,
        price: Number(p.price),
        type: p.type,
        status: p.status === "ACTIVE" ? "HIDDEN" : "ACTIVE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-concessions"] }),
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErr(msg || "Không đổi trạng thái");
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Đồ ăn vặt</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Món khách/POS chọn sau ghế. Ẩn thì không bán mới; đơn cũ giữ snapshot giá.
      </p>
      {err && <div className="mb-3 rounded-lg border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200">{err}</div>}
      <form
        className="mb-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400 sm:col-span-2">
          Tên món
          <input
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bắp rang lớn"
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
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Loại
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-normal text-zinc-100"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-4">
          {editing && (
            <button
              type="button"
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-200"
              onClick={() => {
                setEditing(null);
                setName("");
                setPrice(45000);
                setType("FOOD");
              }}
            >
              Hủy sửa
            </button>
          )}
          <button type="submit" className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-zinc-900 hover:bg-yellow-300">
            {editing ? "Lưu món" : "Thêm món"}
          </button>
        </div>
      </form>
      <ul className="list-none space-y-2 p-0">
        {(listQ.data ?? []).map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
            <span className="w-16 shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-red-400">
              {TYPES.find((t) => t.id === p.type)?.label || p.type}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`font-extrabold ${p.status === "ACTIVE" ? "text-white" : "text-zinc-500"}`}>{p.name}</div>
              <div className="text-xs text-zinc-500">{vnd(p.price)}{p.status !== "ACTIVE" ? " · đã ẩn" : ""}</div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-extrabold text-zinc-100"
              onClick={() => {
                setEditing(p);
                setName(p.name);
                setPrice(Number(p.price));
                setType(p.type);
              }}
            >
              Sửa
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-extrabold text-zinc-100"
              disabled={statusMut.isPending}
              onClick={() => statusMut.mutate(p)}
            >
              {p.status === "ACTIVE" ? "Ẩn" : "Hiện"}
            </button>
          </li>
        ))}
        {listQ.data?.length === 0 && (
          <li className="rounded-xl border border-zinc-800 px-4 py-3 text-zinc-500">Chưa có món.</li>
        )}
      </ul>
    </div>
  );
}
