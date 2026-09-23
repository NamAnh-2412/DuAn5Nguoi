import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cancelHold, fetchSeatMap, holdSeats } from "../api/bookingApi";
import type { SeatCell, SeatMap } from "../api/types";
import SeatGrid from "../components/SeatGrid";
import BookingStepper from "../components/BookingStepper";
import HoldClock from "../components/HoldClock";
import { useAuth } from "../context/AuthContext";
import { useAbandonSale, useHoldSession } from "../context/HoldSessionContext";

const MAX_SEATS = 8;

function mergeSelected(current: number[], map: SeatMap): { next: number[]; lost: string[] } {
  const byId = new Map(map.seats.map((s) => [s.seatId, s]));
  const lost: string[] = [];
  const kept = current.filter((id) => {
    const s = byId.get(id);
    if (!s) return false;
    if (s.status === "HOLD" || s.status === "BOOKED") {
      lost.push(s.label);
      return false;
    }
    return s.status === "AVAILABLE" || s.status === "HOLD_MINE";
  });
  const mine = map.seats.filter((s) => s.status === "HOLD_MINE").map((s) => s.seatId);
  return { next: [...new Set([...kept, ...mine])], lost };
}

export default function SeatMapPage({ channel }: { channel: "ONLINE" | "POS" }) {
  const { showtimeId } = useParams();
  const id = Number(showtimeId);
  const { user } = useAuth();
  const nav = useNavigate();
  const { track, release } = useHoldSession();
  const abortSale = useAbandonSale(channel);
  const [map, setMap] = useState<SeatMap | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [guest, setGuest] = useState("");
  const [err, setErr] = useState("");
  const [holdId, setHoldId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedRef = useRef<number[]>([]);
  const holdIdRef = useRef<number | null>(null);
  const chainRef = useRef(Promise.resolve());
  const firstLoad = useRef(true);

  selectedRef.current = selected;
  holdIdRef.current = holdId;

  const applyMap = (d: SeatMap, replace: boolean) => {
    setMap(d);
    if (replace) {
      const mine = d.seats.filter((s) => s.status === "HOLD_MINE").map((s) => s.seatId);
      setSelected(mine);
      selectedRef.current = mine;
      return;
    }
    const { next, lost } = mergeSelected(selectedRef.current, d);
    setSelected(next);
    selectedRef.current = next;
    if (lost.length) {
      setErr(`Ghế ${lost.join(", ")} đã được người khác giữ trước`);
    }
  };

  const load = (replace = false) =>
    fetchSeatMap(id)
      .then((d) => applyMap(d, replace))
      .catch(() => setErr("Không tải sơ đồ ghế"));

  useEffect(() => {
    firstLoad.current = true;
    load(true).finally(() => {
      firstLoad.current = false;
    });
    const t = setInterval(() => load(false), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const syncHold = (seatIds: number[], guestName?: string) => {
    const job = chainRef.current.then(async () => {
      if (seatIds.length === 0) {
        const existing = holdIdRef.current;
        if (existing) {
          await cancelHold(existing);
          holdIdRef.current = null;
          setHoldId(null);
          setExpiresAt(null);
          release();
        }
        return null;
      }
      const res = await holdSeats({
        showtimeId: id,
        seatIds,
        channel,
        guestName: guestName || undefined,
      });
      holdIdRef.current = res.reservationId;
      setHoldId(res.reservationId);
      setExpiresAt(res.holdExpiresAt);
      track({
        reservationId: res.reservationId,
        showtimeId: id,
        channel,
        expiresAt: res.holdExpiresAt,
      });
      const ids = res.seats.map((s) => s.seatId);
      setSelected(ids);
      selectedRef.current = ids;
      return res;
    });
    chainRef.current = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  };

  const selectedSeats = useMemo(
    () => map?.seats.filter((s) => selected.includes(s.seatId)) ?? [],
    [map, selected],
  );
  const total = selectedSeats.reduce((s, x) => s + Number(x.price), 0);

  const toggle = (seat: SeatCell) => {
    if (seat.status === "BOOKED" || seat.status === "HOLD") return;
    const cur = selectedRef.current;
    let next: number[];
    if (cur.includes(seat.seatId)) {
      next = cur.filter((x) => x !== seat.seatId);
    } else if (cur.length >= MAX_SEATS) {
      setErr(`Tối đa ${MAX_SEATS} ghế mỗi giao dịch`);
      return;
    } else {
      next = [...cur, seat.seatId];
    }
    selectedRef.current = next;
    setSelected(next);
    setErr("");
    syncHold(next, guest).catch((e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      setErr(msg?.code === "SEAT_TAKEN" ? "Ghế vừa bị người khác giữ trước. Chọn ghế khác." : msg?.message || "Không giữ được ghế");
      load(true);
    });
  };

  const holdAndGo = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await syncHold(selectedRef.current, guest);
      const rid = res?.reservationId ?? holdIdRef.current;
      if (!rid) throw new Error("Chưa giữ được ghế");
      nav(channel === "POS" ? `/pos/concessions/${rid}` : `/concessions/${rid}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      setErr(msg?.code === "SEAT_TAKEN" ? "Ghế vừa bị người khác giữ trước. Chọn ghế khác." : msg?.message || "Không giữ được ghế");
      load(true);
    } finally {
      setBusy(false);
    }
  };

  if (!map) return <div className="page">Đang tải sơ đồ...</div>;

  return (
    <div className="page">
      <BookingStepper current={3} />
      <h2>{map.movieTitle}</h2>
      <p className="muted">{map.roomName} · {map.startAt.replace("T", " ").slice(0, 16)}</p>
      <p className="muted">
        Ghế được khóa ngay khi chọn (giữ {map.holdMinutes} phút, không gia hạn khi đổi ghế). Ai giữ trước trên server mới được bán.
      </p>
      <HoldClock
        expiresAt={expiresAt}
        channel={channel}
        showtimeId={id}
        redirectOnExpire={false}
        onExpired={() => {
          holdIdRef.current = null;
          setHoldId(null);
          setExpiresAt(null);
          setSelected([]);
          selectedRef.current = [];
          setErr("Hết thời gian giữ ghế. Chọn lại.");
          load(true);
        }}
      />
      {err && <div className="toast err">{err}</div>}
      {channel === "POS" && (
        <div className="field" style={{ maxWidth: 320 }}>
          <label>Tên khách (tuỳ chọn)</label>
          <input value={guest} onChange={(e) => setGuest(e.target.value)} />
        </div>
      )}
      <SeatGrid seats={map.seats} selected={selected} onToggle={toggle} />
      <div className="row" style={{ justifyContent: "space-between", marginTop: 16 }}>
        <div>
          <div className="muted">
            {selectedSeats.map((s) => s.label).join(", ") || `Chưa chọn ghế (tối đa ${MAX_SEATS})`} · {user?.username}
          </div>
          <div className="price">{total.toLocaleString()}đ</div>
        </div>
        <div className="row">
          <button type="button" className="btn btn-outline" onClick={() => void abortSale()}>
            Hủy giao dịch
          </button>
          <button className="btn btn-yellow" disabled={selected.length === 0 || busy} onClick={holdAndGo}>
            {busy ? "Đang giữ ghế..." : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}
