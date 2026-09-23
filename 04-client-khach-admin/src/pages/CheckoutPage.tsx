import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { confirmCash, confirmOnline, getBooking } from "../api/bookingApi";
import BookingStepper from "../components/BookingStepper";
import HoldClock from "../components/HoldClock";
import type { Reservation } from "../api/types";
import { useAbandonSale, useHoldSession } from "../context/HoldSessionContext";
import { isHoldExpired } from "../lib/holdClock";

export default function CheckoutPage({ channel }: { channel: "ONLINE" | "POS" }) {
  const { reservationId } = useParams();
  const id = Number(reservationId);
  const nav = useNavigate();
  const { track, release } = useHoldSession();
  const abortSale = useAbandonSale(channel);
  const [res, setRes] = useState<Reservation | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBooking(id)
      .then((booking) => {
        setRes(booking);
        if (booking.status === "HOLD" && booking.showtimeId) {
          track({
            reservationId: booking.id,
            showtimeId: booking.showtimeId,
            channel,
            expiresAt: booking.holdExpiresAt ?? null,
          });
        }
      })
      .catch(() => setErr("Không tải được giữ chỗ"));
  }, [id, channel, track]);

  const pay = async () => {
    if (isHoldExpired(res?.holdExpiresAt)) {
      setErr("Hết thời gian giữ ghế");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const done = channel === "POS" ? await confirmCash(id) : await confirmOnline(id);
      release();
      if (channel === "POS") nav(`/pos/print/${done.id}`);
      else nav("/tickets");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg || "Thanh toán thất bại");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Hủy giữ chỗ và trả ghế?")) return;
    await abortSale();
  };

  if (!res) return <div className="page">{err || "Đang tải..."}</div>;

  const expired = isHoldExpired(res.holdExpiresAt);

  return (
    <div className="page">
      <BookingStepper current={5} />
      <div className="panel">
        <h2>{res.movieTitle}</h2>
        <p className="muted">{res.roomName} · {res.startAt?.replace("T", " ").slice(0, 16)}</p>
        <p>Ghế: {res.seatLabels?.join(", ")}</p>
        {res.guestName && <p>Khách: {res.guestName}</p>}
        {(res.concessions ?? []).length > 0 && (
          <p>
            Đồ ăn vặt: {(res.concessions ?? []).map((c) => `${c.name} x${c.qty}`).join(", ")}
          </p>
        )}
        <HoldClock expiresAt={res.holdExpiresAt} channel={channel} showtimeId={res.showtimeId} />
        <p className="muted">
          Vé {Number(res.seatsSubtotal ?? res.totalAmount).toLocaleString()}đ
          {(res.concessionsSubtotal ?? 0) > 0 ? ` · Đồ ăn vặt ${Number(res.concessionsSubtotal).toLocaleString()}đ` : ""}
        </p>
        <p className={channel === "POS" ? "pos-price" : "price"}>{Number(res.totalAmount).toLocaleString()}đ</p>
        {err && <div className="toast err">{err}</div>}
        <div className="row">
          <button
            className="btn btn-outline"
            disabled={busy || expired}
            onClick={() => nav(channel === "POS" ? `/pos/concessions/${id}` : `/concessions/${id}`)}
          >
            Sửa đồ ăn vặt
          </button>
          <button className="btn btn-yellow" disabled={busy || expired} onClick={() => void pay()}>
            {busy ? "Đang thanh toán..." : channel === "POS" ? "Đã thu tiền" : "Thanh toán giả lập"}
          </button>
          <button className="btn btn-outline" disabled={busy} onClick={() => void cancel()}>
            Hủy giao dịch
          </button>
        </div>
      </div>
    </div>
  );
}
