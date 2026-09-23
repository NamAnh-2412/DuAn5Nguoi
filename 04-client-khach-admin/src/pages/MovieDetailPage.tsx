import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchMovie, fetchShowtimes } from "../api/catalogApi";
import type { Movie, Showtime } from "../api/types";
import Poster from "../components/Poster";
import TrailerModal from "../components/TrailerModal";
import { useAuth } from "../context/AuthContext";
import { youtubeEmbedSrc, youtubeId } from "../lib/youtube";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const STATUS_LABEL: Record<string, string> = {
  SHOWING: "Đang chiếu",
  COMING: "Sắp chiếu",
  HIDDEN: "Ngừng chiếu",
};

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const id = Number(movieId);
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [date, setDate] = useState(today());
  const [shows, setShows] = useState<Showtime[]>([]);
  const [err, setErr] = useState("");
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) {
      setErr("Không tìm thấy phim");
      setMovie(null);
      return;
    }
    setErr("");
    fetchMovie(id)
      .then(setMovie)
      .catch(() => {
        setMovie(null);
        setErr("Không tìm thấy phim");
      });
  }, [id]);

  useEffect(() => {
    if (!movie || movie.status !== "SHOWING") {
      setShows([]);
      return;
    }
    fetchShowtimes(id, date).then(setShows).catch(() => setShows([]));
  }, [id, date, movie]);

  useEffect(() => {
    if (!movie || loc.hash !== "#lich-chieu") return;
    document.getElementById("lich-chieu")?.scrollIntoView({ behavior: "smooth" });
  }, [movie, loc.hash]);

  const trailer = youtubeId(movie?.trailerUrl);
  const canBook = movie?.status === "SHOWING" && user?.role !== "ADMIN";

  const pick = (sid: number) => {
    if (user?.role === "ADMIN") return;
    if (user?.role === "CASHIER") {
      nav(`/pos/book/${sid}`);
      return;
    }
    if (!user) {
      nav("/login", { state: { from: `/book/${sid}` } });
      return;
    }
    nav(`/book/${sid}`);
  };

  return (
    <div>
      {movie && (
        <section className="hero hero-detail">
          <div className="hero-art"><Poster movie={movie} wide /></div>
          <div className="hero-fade" />
          <div className="hero-inner">
            <div>
              <div className="chips" style={{ marginBottom: 10 }}>
                <span className="badge">{movie.rated}</span>
                <span className="chip">{STATUS_LABEL[movie.status] || movie.status}</span>
              </div>
              <h1>{movie.title}</h1>
              <div className="chips">
                {movie.genreName && <span className="chip">{movie.genreName}</span>}
                <span className="chip">{movie.durationMinutes} phút</span>
                {movie.releaseDate && <span className="chip">KC {formatDate(movie.releaseDate)}</span>}
              </div>
              <div className="hero-actions">
                {movie.status === "SHOWING" && (
                  <a className="play-btn" href="#lich-chieu" title="Chọn suất"><i /></a>
                )}
                {trailer && (
                  <button type="button" className="trailer-btn" onClick={() => setTrailerOpen(true)}>
                    Xem trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="page">
        {err && <div className="toast err">{err}</div>}
        {movie?.status === "HIDDEN" && (
          <div className="toast">Phim đang ngừng chiếu — chỉ admin xem được trang này.</div>
        )}
        {movie?.status === "COMING" && (
          <div className="toast">Phim sắp chiếu — chưa mở bán vé.</div>
        )}

        {movie && (
          <div className="movie-detail">
            <div className="movie-detail-poster">
              <Poster movie={movie} />
            </div>
            <div>
              <h2 style={{ marginTop: 0 }}>Thông tin phim</h2>
              <dl className="movie-dl">
                <dt>Thể loại</dt>
                <dd>{movie.genreName || "—"}</dd>
                <dt>Thời lượng</dt>
                <dd>{movie.durationMinutes} phút</dd>
                <dt>Giới hạn tuổi</dt>
                <dd>{movie.rated || "—"}</dd>
                <dt>Đạo diễn</dt>
                <dd>{movie.director || "—"}</dd>
                <dt>Diễn viên</dt>
                <dd>{movie.castNames || "—"}</dd>
                <dt>Khởi chiếu</dt>
                <dd>{formatDate(movie.releaseDate) || "—"}</dd>
              </dl>
              <p className="movie-desc">
                {movie.description || "Chưa có mô tả."}
              </p>
              {trailer && movie.trailerUrl && (
                <div className="trailer-frame" style={{ marginTop: 20 }}>
                  <iframe
                    title={`${movie.title} trailer`}
                    src={youtubeEmbedSrc(trailer)}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {movie?.status === "SHOWING" && (
          <div className="panel" id="lich-chieu">
            <h2 style={{ marginTop: 0 }}>Lịch chiếu</h2>
            {user?.role === "ADMIN" && (
              <p className="muted">Bạn đang xem với tài khoản admin — không đặt vé tại đây.</p>
            )}
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Ngày chiếu</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="chips">
              {shows.map((s) => (
                <button
                  key={s.id}
                  className="chip"
                  type="button"
                  disabled={!canBook}
                  onClick={() => pick(s.id)}
                >
                  {s.startAt.slice(11, 16)} · {s.roomName}
                  <div className="muted">{Number(s.basePrice).toLocaleString()}đ</div>
                </button>
              ))}
              {shows.length === 0 && <p className="muted">Không có suất ngày này.</p>}
            </div>
          </div>
        )}

        <p style={{ marginTop: 24 }}>
          <Link to="/">← Về trang phim</Link>
          {user?.role === "ADMIN" && (
            <>
              {" · "}
              <Link to="/admin/movies">Quản lý phim</Link>
            </>
          )}
        </p>
      </div>

      {trailerOpen && movie?.trailerUrl && (
        <TrailerModal url={movie.trailerUrl} title={movie.title} onClose={() => setTrailerOpen(false)} />
      )}
    </div>
  );
}
