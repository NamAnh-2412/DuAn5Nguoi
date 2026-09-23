import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchGenres, fetchMovies } from "../api/catalogApi";
import type { Movie } from "../api/types";
import Poster from "../components/Poster";
import TrailerModal from "../components/TrailerModal";
import { useBrand } from "../context/BrandContext";
import { assetUrl } from "../lib/assetUrl";
import { youtubeId } from "../lib/youtube";

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tab = params.get("tab") === "coming" ? "COMING" : "SHOWING";
  const genre = params.get("genre") ?? "";

  const [showing, setShowing] = useState<Movie[]>([]);
  const [coming, setComing] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [err, setErr] = useState("");
  const { name, imageUrl } = useBrand();
  const cinemaBg = assetUrl(imageUrl);

  useEffect(() => {
    Promise.all([
      fetchMovies({ status: "SHOWING", size: 24, sort: "title,asc" }),
      fetchMovies({ status: "COMING", size: 24, sort: "title,asc" }),
      fetchGenres(),
    ])
      .then(([a, b, g]) => {
        setShowing(a.content);
        setComing(b.content);
        setGenres(g);
      })
      .catch(() => setErr("Không tải được phim. Kiểm tra API :8080."));
  }, []);

  const all = useMemo(() => [...showing, ...coming], [showing, coming]);
  const featured = showing[heroIdx] ?? showing[0];
  const searching = Boolean(q || genre || params.get("tab"));

  const filtered = useMemo(() => {
    const src = tab === "COMING" ? coming : q || genre ? all : showing;
    return src.filter((m) => {
      const okQ = !q || m.title.toLowerCase().includes(q.toLowerCase());
      const okG = !genre || (m.genreName || "") === genre;
      return okQ && okG;
    });
  }, [all, showing, coming, q, genre, tab]);

  const setGenre = (name: string) => {
    const next = new URLSearchParams(params);
    if (name) next.set("genre", name);
    else next.delete("genre");
    next.delete("tab");
    setParams(next);
  };

  return (
    <div>
      {err && <div className="page"><div className="toast err">{err}</div></div>}

      {!searching && featured && (
        <section className="hero">
          <div className="hero-art">
            {cinemaBg ? <img src={cinemaBg} alt="" /> : <Poster movie={featured} wide />}
          </div>
          <div className="hero-fade" />
          <div className="hero-inner">
            <div>
              <h1>{featured.title}</h1>
              <p className="hero-desc">{featured.description || `Đặt vé online tại ${name} — một rạp, không trùng ghế.`}</p>
              <div className="chips">
                <span className="badge">{featured.rated}</span>
                <span className="chip">{featured.genreName}</span>
                <span className="chip">{featured.durationMinutes} phút</span>
              </div>
              <div className="hero-actions">
                <Link className="play-btn" to={`/movies/${featured.id}#lich-chieu`} title="Mua vé"><i /></Link>
                {youtubeId(featured.trailerUrl) && (
                  <button type="button" className="trailer-btn" onClick={() => setTrailerOpen(true)}>
                    Xem trailer
                  </button>
                )}
                <Link className="round-btn" to={`/movies/${featured.id}`} title="Chi tiết">i</Link>
              </div>
            </div>
            <div className="hero-thumbs">
              {showing.slice(0, 6).map((m, i) => (
                <button
                  key={m.id}
                  className={`hero-thumb ${i === heroIdx ? "on" : ""}`}
                  onClick={() => setHeroIdx(i)}
                  title={m.title}
                >
                  <Poster movie={m} wide />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="home-body">
        {!searching && (
          <>
            <h2 className="section-title">Bạn đang quan tâm gì?</h2>
            <div className="topics">
              {genres.map((g, i) => (
                <div
                  key={g.id}
                  role="button"
                  tabIndex={0}
                  className={`topic c${i % 6}`}
                  onClick={() => setGenre(g.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setGenre(g.name);
                    }
                  }}
                >
                  <span className="topic-fill" aria-hidden />
                  <span className="topic-name">{g.name}</span>
                  <small>Xem chủ đề ›</small>
                </div>
              ))}
            </div>

            <Rail title="Đang chiếu" movies={showing} showing />
            <Rail title="Sắp chiếu" movies={coming} />
          </>
        )}

        {searching && (
          <>
            <div className="row" style={{ marginBottom: 16, justifyContent: "space-between" }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                {q ? `Kết quả cho “${q}”` : genre ? genre : tab === "COMING" ? "Sắp chiếu" : "Đang chiếu"}
              </h2>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                aria-label="Lọc theo thể loại"
              >
                <option value="">Mọi thể loại</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="grid">
              {filtered.map((m) => (
                <Link className="card" key={m.id} to={`/movies/${m.id}`}>
                  <Poster movie={m} />
                  <div className="card-body">
                    <div><span className="badge">{m.rated}</span><span className="muted">{m.genreName}</span></div>
                    <strong>{m.title}</strong>
                    <span className="muted">{m.durationMinutes} phút</span>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && <p className="muted">Không có phim phù hợp.</p>}
            </div>
          </>
        )}
      </div>
      {trailerOpen && featured?.trailerUrl && (
        <TrailerModal url={featured.trailerUrl} title={featured.title} onClose={() => setTrailerOpen(false)} />
      )}
    </div>
  );
}

function favoriteCountOf(movie: Movie): number {
  if (movie.favoriteCount && movie.favoriteCount > 0) return movie.favoriteCount;
  return 80 + ((movie.id * 53) % 920);
}

function formatFavoriteCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 || n % 1000 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return String(n);
}

function Rail({ title, movies, showing }: { title: string; movies: Movie[]; showing?: boolean }) {
  if (movies.length === 0) return null;
  return (
    <section className="rail">
      <div className="rail-head">
        <h2>{title}</h2>
        <Link to={showing ? "/?tab=showing" : "/?tab=coming"}>Xem toàn bộ ›</Link>
      </div>
      <div className="rail-scroll">
        {movies.map((m) => (
          <Link className="wide-card" key={m.id} to={`/movies/${m.id}`}>
            <div className="wide-card-art">
              <Poster movie={m} wide />
              <span className="ep-badge">{m.rated} · {m.durationMinutes}p</span>
              <span className="fav-badge" title="Lượt yêu thích">
                <span className="fav-icon" aria-hidden>♥</span>
                {formatFavoriteCount(favoriteCountOf(m))}
              </span>
            </div>
            <span className="wide-card-meta">
              <strong>{m.title}</strong>
              {m.genreName ? <span className="muted">{m.genreName}</span> : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
