import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchConcessions } from "../api/catalogApi";
import { getBooking, setBookingConcessions } from "../api/bookingApi";
import type { ConcessionProduct, Reservation } from "../api/types";
import BookingStepper from "../components/BookingStepper";
import HoldClock from "../components/HoldClock";
import { useAbandonSale, useHoldSession } from "../context/HoldSessionContext";
import { isHoldExpired } from "../lib/holdClock";

const TYPE_LABEL: Record<string, string> = {
  FOOD: "Đồ ăn",
  DRINK: "Nước",
  COMBO: "Combo",
};

export default function ConcessionPage({ channel }: { channel: "ONLINE" | "POS" }) {
  const { reservationId } = useParams();
  const id = Number(reservationId);
  const nav = useNavigate();
  const { track } = useHoldSession();
  const abortSale = useAbandonSale(channel);
  const [res, setRes] = useState<Reservation | null>(null);
  const [products, setProducts] = useState<ConcessionProduct[]>([]);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getBooking(id), fetchConcessions()])
      .then(([booking, list]) => {
        setRes(booking);
        if (booking.status === "HOLD" && booking.showtimeId) {
          track({
            reservationId: booking.id,
            showtimeId: booking.showtimeId,
            channel,
            expiresAt: booking.holdExpiresAt ?? null,
          });
        }
        setProducts(list.filter((p) => p.status === "ACTIVE"));
        const next: Record<number, number> = {};
        for (const line of booking.concessions ?? []) {
          if (line.productId) next[line.productId] = line.qty;
        }
        setQty(next);
      })
      .catch(() => setErr("Không tải được đồ ăn vặt"));
  }, [id]);

  const seats = Number(res?.seatsSubtotal ?? 0);
  const fnb = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.price) * (qty[p.id] ?? 0), 0);
  }, [products, qty]);

  const checkout = channel === "POS" ? `/pos/checkout/${id}` : `/checkout/${id}`;

  const save = async (items: { productId: number; qty: number }[]) => {
    setErr("");
    setSaving(true);
    try {
      await setBookingConcessions(id, items);
      nav(checkout);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg || "Không lưu được đồ ăn vặt");
    } finally {
      setSaving(false);
    }
  };

  const continuePay = () => {
    const items = Object.entries(qty)
      .map(([productId, n]) => ({ productId: Number(productId), qty: n }))
      .filter((x) => x.qty > 0);
    return save(items);
  };

  if (!res) return <div className="page">{err || "Đang tải..."}</div>;

  const expired = isHoldExpired(res.holdExpiresAt);

  return (
    <div className="page">
      <BookingStepper current={4} />
      <h2>Đồ ăn vặt</h2>
      <p className="muted">
        {res.movieTitle} · ghế {res.seatLabels?.join(", ")} · bước này có thể bỏ qua
      </p>
      <HoldClock expiresAt={res.holdExpiresAt} channel={channel} showtimeId={res.showtimeId} />
      {err && <div className="toast err">{err}</div>}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginTop: 16 }}>
        {products.map((p) => {
          const n = qty[p.id] ?? 0;
          return (
            <div className="panel" key={p.id}>
              <div className="muted">{TYPE_LABEL[p.type] || p.type}</div>
              <strong>{p.name}</strong>
              <div className="price" style={{ fontSize: 18 }}>{Number(p.price).toLocaleString()}đ</div>
              <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={n <= 0}
                  onClick={() => setQty((q) => ({ ...q, [p.id]: Math.max(0, (q[p.id] ?? 0) - 1) }))}
                >
                  −
                </button>
                <strong>{n}</strong>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={n >= 8}
                  onClick={() => setQty((q) => ({ ...q, [p.id]: Math.min(8, (q[p.id] ?? 0) + 1) }))}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && <p className="muted">Chưa có món đang bán.</p>}
      </div>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 20 }}>
        <div>
          <div className="muted">Ghế {seats.toLocaleString()}đ · Đồ ăn vặt {fnb.toLocaleString()}đ</div>
          <div className={channel === "POS" ? "pos-price" : "price"}>{(seats + fnb).toLocaleString()}đ</div>
        </div>
        <div className="row">
          <button type="button" className="btn btn-outline" disabled={saving} onClick={() => void abortSale()}>
            Hủy giao dịch
          </button>
          <button type="button" className="btn btn-outline" disabled={saving || expired} onClick={() => save([])}>
            Bỏ qua
          </button>
          <button type="button" className="btn btn-yellow" disabled={saving || expired} onClick={continuePay}>
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
