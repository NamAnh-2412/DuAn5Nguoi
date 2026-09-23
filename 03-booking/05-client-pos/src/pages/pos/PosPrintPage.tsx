import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBooking } from "../../api/bookingApi";
import type { Reservation } from "../../api/types";
import { useBrand } from "../../context/BrandContext";

export default function PosPrintPage() {
  const { reservationId } = useParams();
  const { name } = useBrand();
  const [res, setRes] = useState<Reservation | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getBooking(Number(reservationId))
      .then(setRes)
      .catch(() => setErr("Không tải được vé"));
  }, [reservationId]);

  if (err) {
    return (
      <div className="page">
        <div className="toast err">{err}</div>
        <Link className="btn btn-outline" to="/pos" style={{ marginTop: 16 }}>Về bán vé</Link>
      </div>
    );
  }
  if (!res) return <div className="page">Đang tải vé...</div>;

  return (
    <div className="page">
      <div className="panel print-area" id="print-area">
        <h2>{name}</h2>
        <p>{res.movieTitle}</p>
        <p>{res.roomName} · {res.startAt?.replace("T", " ").slice(0, 16)}</p>
        {res.guestName && <p>Khách: {res.guestName}</p>}
        {res.tickets?.map((t) => (
          <div key={t.ticketCode} style={{ borderTop: "1px dashed #ccc", paddingTop: 8 }}>
            <strong>{t.ticketCode}</strong>
            <div>Ghế {t.seatLabel}</div>
            <div className="muted">{t.qrPayload}</div>
          </div>
        ))}
        {(res.concessions ?? []).length > 0 && (
          <div style={{ borderTop: "1px dashed #ccc", paddingTop: 8 }}>
            <strong>Đồ ăn vặt</strong>
            {(res.concessions ?? []).map((c) => (
              <div key={`${c.productId}-${c.name}`}>{c.name} x{c.qty} · {Number(c.lineTotal).toLocaleString()}đ</div>
            ))}
          </div>
        )}
        <p className="price">{Number(res.totalAmount).toLocaleString()}đ</p>
      </div>
      <div className="row no-print" style={{ marginTop: 16 }}>
        <button className="btn btn-yellow" onClick={() => window.print()}>In vé</button>
        <Link className="btn btn-outline" to="/pos">Giao dịch mới</Link>
        <Link className="btn btn-outline" to="/pos/tickets">Soát / in lại</Link>
      </div>
    </div>
  );
}
