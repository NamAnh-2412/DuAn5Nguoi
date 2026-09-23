import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenueReport } from "../../api/bookingApi";
import type { RevenueMoney } from "../../api/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoDay(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function vnd(n: number | string | undefined) {
  return `${Number(n ?? 0).toLocaleString("vi-VN")}đ`;
}

function Card({ title, m }: { title: string; m?: RevenueMoney }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="text-xs font-extrabold uppercase tracking-wide text-zinc-500">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-yellow-400">{vnd(m?.total)}</div>
      <div className="mt-2 text-xs text-zinc-400">
        Vé {vnd(m?.ticket)} · Đồ ăn vặt {vnd(m?.concession)} · {m?.ticketsSold ?? 0} ghế
      </div>
    </div>
  );
}

export default function ReportAdminPage() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(isoDay(new Date()));
  const [grain, setGrain] = useState("DAY");
  const q = useQuery({
    queryKey: ["admin-revenue", from, to, grain],
    queryFn: () => fetchRevenueReport({ from, to, grain }),
  });
  const data = q.data;
  const max = useMemo(() => {
    const vals = (data?.series ?? []).map((s) => Number(s.total));
    return Math.max(1, ...vals);
  }, [data]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Báo cáo</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Doanh thu theo <strong className="text-zinc-200">lúc thanh toán</strong>. Tách vé và đồ ăn vặt.
      </p>
      {q.isError && (
        <div className="mb-3 rounded-lg border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200">
          Không tải được báo cáo. Đăng nhập admin rồi thử lại.
        </div>
      )}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card title="Hôm nay" m={data?.today} />
        <Card title="Tuần này" m={data?.week} />
        <Card title="Tháng này" m={data?.month} />
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Từ ngày
          <input className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Đến ngày
          <input className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Nhóm
          <select className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" value={grain} onChange={(e) => setGrain(e.target.value)}>
            <option value="DAY">Ngày</option>
            <option value="WEEK">Tuần</option>
            <option value="MONTH">Tháng</option>
          </select>
        </label>
      </div>
      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-base font-extrabold">Biểu đồ khoảng chọn</h2>
          <div className="text-xs text-zinc-400">
            <span className="mr-3 inline-block h-2 w-3 rounded-sm bg-yellow-400" /> Vé
            <span className="ml-3 mr-3 inline-block h-2 w-3 rounded-sm bg-red-500" /> Đồ ăn vặt
          </div>
        </div>
        <div className="flex h-48 items-end gap-1 overflow-x-auto">
          {(data?.series ?? []).map((s) => {
            const t = Number(s.ticket);
            const c = Number(s.concession);
            const h = (Number(s.total) / max) * 100;
            const ticketH = Number(s.total) > 0 ? (t / Number(s.total)) * h : 0;
            const fnbH = Number(s.total) > 0 ? (c / Number(s.total)) * h : 0;
            return (
              <div key={`${s.date}-${s.label}`} className="flex min-w-8 flex-1 flex-col items-center justify-end" title={`${s.label}: ${vnd(s.total)}`}>
                <div className="flex w-full flex-col justify-end" style={{ height: "100%" }}>
                  <div className="w-full rounded-t-sm bg-red-500" style={{ height: `${fnbH}%` }} />
                  <div className="w-full bg-yellow-400" style={{ height: `${ticketH}%` }} />
                </div>
                <div className="mt-1 truncate text-[10px] text-zinc-500">{s.label}</div>
              </div>
            );
          })}
          {(data?.series ?? []).length === 0 && <p className="text-sm text-zinc-500">Chưa có doanh thu trong khoảng này.</p>}
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Tổng khoảng: <strong className="text-yellow-400">{vnd(data?.range.totals.total)}</strong>
          {" "}· vé {vnd(data?.range.totals.ticket)} · đồ ăn vặt {vnd(data?.range.totals.concession)}
          {" "}· ONLINE {vnd(data?.byChannel.online.total)} · POS {vnd(data?.byChannel.pos.total)}
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="mt-0 text-base font-extrabold">Top 5 phim xem nhiều</h2>
          <ol className="m-0 list-decimal space-y-2 pl-5 text-sm">
            {(data?.topMovies ?? []).map((m) => (
              <li key={`${m.movieId}-${m.movieTitle}`} className="text-zinc-200">
                <span className="font-semibold">{m.movieTitle}</span>
                <span className="text-zinc-500"> · {m.tickets} vé · {vnd(m.revenue)}</span>
              </li>
            ))}
          </ol>
          {(data?.topMovies ?? []).length === 0 && <p className="text-sm text-zinc-500">Chưa có vé trong khoảng này.</p>}
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="mt-0 text-base font-extrabold">Top đồ ăn vặt</h2>
          <ol className="m-0 list-decimal space-y-2 pl-5 text-sm">
            {(data?.topConcessions ?? []).map((p) => (
              <li key={`${p.productId}-${p.name}`} className="text-zinc-200">
                <span className="font-semibold">{p.name}</span>
                <span className="text-zinc-500"> · {p.qty} · {vnd(p.revenue)}</span>
              </li>
            ))}
          </ol>
          {(data?.topConcessions ?? []).length === 0 && <p className="text-sm text-zinc-500">Chưa bán đồ ăn vặt trong khoảng này.</p>}
        </section>
      </div>
    </div>
  );
}
