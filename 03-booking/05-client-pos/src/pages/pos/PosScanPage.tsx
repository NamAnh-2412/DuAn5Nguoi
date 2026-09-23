import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { checkInTicket, lookupTicket, type TicketLookup } from "../../api/bookingApi";

function statusLabel(status: string) {
  if (status === "CHECKED_IN") return "Đã vào cửa";
  if (status === "ISSUED") return "Chưa soát";
  return status;
}

export default function PosScanPage() {
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState<TicketLookup | null>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const lookup = async (e?: FormEvent) => {
    e?.preventDefault();
    setErr("");
    setOk("");
    setTicket(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setErr("Nhập mã vé");
      return;
    }
    setBusy(true);
    try {
      setTicket(await lookupTicket(trimmed));
    } catch {
      setErr("Không có mã vé");
    } finally {
      setBusy(false);
    }
  };

  const checkIn = async () => {
    if (!ticket) return;
    setErr("");
    setOk("");
    setBusy(true);
    try {
      const done = await checkInTicket(ticket.ticketCode);
      setTicket(done);
      setOk("Soát vé thành công");
    } catch (e: unknown) {
      const body = (e as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      setErr(body?.code === "ALREADY_CHECKED_IN" ? "Vé đã soát rồi" : body?.message || "Không soát được vé");
    } finally {
      setBusy(false);
    }
  };

  const checked = ticket?.status === "CHECKED_IN";

  return (
    <div className="page">
      <h1>Soát vé</h1>
      <p className="muted">Tra mã, xác nhận vào cửa một lần, hoặc in lại vé đã bán.</p>
      <form onSubmit={(e) => void lookup(e)}>
        <div className="field" style={{ maxWidth: 360 }}>
          <label>Mã vé</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VX-2026-..."
            autoFocus
          />
        </div>
        <button className="btn btn-yellow" type="submit" disabled={busy}>
          {busy ? "Đang kiểm tra..." : "Kiểm tra"}
        </button>
      </form>
      {err && <div className="toast err" style={{ marginTop: 16 }}>{err}</div>}
      {ok && <div className="toast" style={{ marginTop: 16 }}>{ok}</div>}
      {ticket && (
        <div className="panel" style={{ marginTop: 16, maxWidth: 480 }}>
          <p><strong>{ticket.ticketCode}</strong></p>
          <p>{ticket.movieTitle}</p>
          <p className="muted">
            {ticket.roomName} · {ticket.startAt?.replace("T", " ").slice(0, 16)} · ghế {ticket.seatLabel}
          </p>
          <p>
            Trạng thái: <strong>{statusLabel(ticket.status)}</strong>
            {ticket.checkedInAt ? ` · ${ticket.checkedInAt.replace("T", " ").slice(0, 16)}` : ""}
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-yellow"
              disabled={busy || checked}
              onClick={() => void checkIn()}
            >
              {checked ? "Đã vào cửa" : "Xác nhận vào cửa"}
            </button>
            {ticket.reservationId ? (
              <Link className="btn btn-outline" to={`/pos/print/${ticket.reservationId}`}>
                In lại
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
