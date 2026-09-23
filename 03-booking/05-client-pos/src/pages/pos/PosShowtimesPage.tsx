import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { fetchMovie, fetchShowtimes } from "../../api/catalogApi";
import type { Movie, Showtime } from "../../api/types";
import BookingStepper from "../../components/BookingStepper";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function hm(iso: unknown) {
  if (typeof iso !== "string") return "—";
  return iso.includes("T") ? iso.slice(11, 16) : iso;
}

function started(iso?: string) {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
}

function occupancyOf(s: Showtime) {
  const hold = Number(s.hold ?? 0);
  const booked = Number(s.booked ?? 0);
  const capacity = Number(s.capacity ?? 0);
  const taken = hold + booked;
  return {
    hold,
    booked,
    capacity,
    taken,
    soldOut: capacity > 0 && taken >= capacity,
  };
}

/** Old /pos/movies/:id links keep working without leaving the POS /pos route. */
export function PosMovieRedirect() {
  const { movieId } = useParams();
  const id = Number(movieId);
  if (!Number.isFinite(id) || id < 1) return <Navigate to="/pos" replace />;
  return <Navigate to={`/pos?movie=${id}`} replace />;
}

export default function PosShowtimesPage({ movieId: movieIdProp }: { movieId?: number } = {}) {
  const { movieId: movieIdParam } = useParams();
  const [params] = useSearchParams();
  const id = movieIdProp ?? Number(movieIdParam ?? params.get("movie"));
  const [movie, setMovie] = useState<Movie | null>(null);
  const [date, setDate] = useState(() => today());
  const [shows, setShows] = useState<Showtime[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) return;
    let cancelled = false;
    setErr("");
    fetchMovie(id)
      .then((m) => {
        if (!cancelled) setMovie(m);
      })
      .catch(() => {
        if (!cancelled) {
          setMovie(null);
          setErr("Không tìm thấy phim");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) return;
    let cancelled = false;
    fetchShowtimes(id, date)
      .then((rows) => {
        if (!cancelled) setShows(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) {
          setShows([]);
          setErr("Không tải được suất chiếu");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, date]);

  return (
    <div className="page">
      <BookingStepper current={2} />
      <p className="muted"><Link to="/pos">← Phim</Link></p>
      <h1>{movie?.title ?? "Suất chiếu"}</h1>
      {err && <div className="toast err">{err}</div>}
      <div className="field" style={{ maxWidth: 220 }}>
        <label>Ngày</label>
        <input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {shows.length === 0 && <p className="muted">Không còn suất ngày này. Chọn ngày khác — hệ thống không tự chuyển ngày.</p>}
      {shows.map((s) => {
        const live = started(s.startAt);
        const occ = occupancyOf(s);
        const body = (
          <>
            <strong>{hm(s.startAt)} – {hm(s.endAt)}</strong>
            {live && <span className="badge" style={{ marginLeft: 8 }}>Đang chiếu</span>}
            {occ.soldOut && <span className="badge" style={{ marginLeft: 8 }}>Hết ghế</span>}
            <div className="muted">
              {s.roomName} · {Number(s.basePrice).toLocaleString()}đ
              {occ.capacity > 0 ? ` · ${occ.booked} bán / ${occ.hold} giữ / ${occ.capacity} ghế` : ""}
            </div>
          </>
        );
        if (occ.soldOut) {
          return (
            <div key={s.id} className="panel" style={{ display: "block", marginBottom: 12, opacity: 0.7 }}>
              {body}
            </div>
          );
        }
        return (
          <Link key={s.id} to={`/pos/book/${s.id}`} className="panel" style={{ display: "block", marginBottom: 12 }}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
