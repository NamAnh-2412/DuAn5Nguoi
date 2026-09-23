import type { SeatCell } from "../api/types";

type Props = {
  seats: SeatCell[];
  selected: number[];
  onToggle: (seat: SeatCell) => void;
};

export default function SeatGrid({ seats, selected, onToggle }: Props) {
  const rows = [...new Set(seats.map((s) => s.row))];
  return (
    <>
      <div className="screen">MÀN HÌNH</div>
      <div className="seat-grid">
        {rows.map((row) => (
          <div className="seat-row" key={row}>
            <span className="seat-lab">{row}</span>
            {seats
              .filter((s) => s.row === row)
              .map((s) => {
                const mine = selected.includes(s.seatId) || s.status === "HOLD_MINE";
                const state =
                  s.status === "BOOKED"
                    ? "booked"
                    : s.status === "HOLD" && !mine
                      ? "hold"
                      : mine
                        ? "mine"
                        : "";
                const cls = s.type === "VIP" ? `vip ${state}` : state;
                const disabled = s.status === "BOOKED" || (s.status === "HOLD" && !mine);
                return (
                  <button
                    key={s.seatId}
                    className={`seat ${cls}`}
                    disabled={disabled}
                    title={`${s.label} ${s.price.toLocaleString()}đ`}
                    onClick={() => onToggle(s)}
                  >
                    {s.number}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
      <div className="legend">
        <span><i style={{ background: "#fff" }} /> Trống</span>
        <span><i style={{ background: "var(--brand-yellow)" }} /> Đang chọn</span>
        <span><i style={{ background: "var(--sold)" }} /> Đang giữ</span>
        <span><i style={{ background: "#6b7280" }} /> Đã bán</span>
        <span><i style={{ borderColor: "var(--brand-red)" }} /> VIP</span>
      </div>
    </>
  );
}
