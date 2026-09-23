import { useEffect, useState } from "react";
import { myTickets } from "../api/bookingApi";
import type { Reservation } from "../api/types";

export default function TicketsPage() {
  const [list, setList] = useState<Reservation[]>([]);
  useEffect(() => {
    myTickets().then(setList).catch(() => setList([]));
  }, []);

  return (
    <div className="page">
      <h1>Vé của tôi</h1>
      {list.length === 0 && <p className="muted">Chưa có vé.</p>}
      {list.map((r) => (
        <div className="panel" key={r.id} style={{ marginBottom: 16 }}>
          <h3>{r.movieTitle}</h3>
          <p className="muted">{r.roomName} · {r.startAt?.replace("T", " ").slice(0, 16)}</p>
          {r.tickets?.map((t) => (
            <p key={t.ticketCode}>
              <strong>{t.ticketCode}</strong> — ghế {t.seatLabel}
            </p>
          ))}
          {(r.concessions ?? []).length > 0 && (
            <p className="muted">
              Đồ ăn vặt: {(r.concessions ?? []).map((c) => `${c.name} x${c.qty}`).join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
