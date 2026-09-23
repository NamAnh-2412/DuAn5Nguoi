import { useQuery } from "@tanstack/react-query";
import { fetchRevenueReport } from "../../api/bookingApi";
import type { RevenueMoney } from "../../api/types";

function vnd(n: number | string | undefined) {
  return `${Number(n ?? 0).toLocaleString("vi-VN")}đ`;
}

function Stat({ title, hint, m }: { title: string; hint: string; m?: RevenueMoney }) {
  return (
    <article className="panel pos-stat">
      <div className="muted">{title}</div>
      <strong className="pos-stat-total">{vnd(m?.total)}</strong>
      <div>Vé {vnd(m?.ticket)}</div>
      <div>Đồ ăn vặt {vnd(m?.concession)}</div>
      <div className="muted">{m?.ticketsSold ?? 0} ghế · {hint}</div>
    </article>
  );
}

export default function PosRevenuePage() {
  const q = useQuery({
    queryKey: ["pos-revenue"],
    queryFn: () => fetchRevenueReport(),
  });
  const data = q.data;

  return (
    <div className="page">
      <h1>Doanh thu</h1>
      <p className="muted">Tiền đã thu lúc khách thanh toán. Gồm vé đặt online và vé bán tại quầy.</p>
      {q.isError && <div className="toast err">Không tải được doanh thu. Thử đăng nhập lại.</div>}
      {q.isPending && <p className="muted">Đang tải...</p>}
      {data && (
        <>
          <div className="pos-stats">
            <Stat title="Hôm nay" hint="trong ngày" m={data.today} />
            <Stat title="Tuần này" hint="từ thứ Hai" m={data.week} />
            <Stat title="Tháng này" hint="từ đầu tháng" m={data.month} />
          </div>
          <div className="pos-stats">
            <Stat title="Online · tháng này" hint="khách tự đặt" m={data.byChannel.online} />
            <Stat title="Quầy · tháng này" hint="nhân viên bán" m={data.byChannel.pos} />
          </div>
          <section className="panel">
            <h2 style={{ marginTop: 0 }}>Phim bán chạy trong tháng</h2>
            {(data.topMovies ?? []).length === 0 && <p className="muted">Chưa có vé trong tháng này.</p>}
            <ol>
              {data.topMovies.map((m) => (
                <li key={`${m.movieId}-${m.movieTitle}`}>
                  <strong>{m.movieTitle}</strong>
                  <span className="muted"> · {m.tickets} vé · {vnd(m.revenue)}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
