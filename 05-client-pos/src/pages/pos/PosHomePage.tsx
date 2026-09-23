import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchMovies } from "../../api/catalogApi";
import type { Movie } from "../../api/types";
import Poster from "../../components/Poster";
import BookingStepper from "../../components/BookingStepper";
import PosShowtimesPage from "./PosShowtimesPage";

export default function PosHomePage() {
  const [params] = useSearchParams();
  const selectedId = Number(params.get("movie"));
  const [movies, setMovies] = useState<Movie[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchMovies({ status: "SHOWING", size: 50, sort: "title,asc" })
      .then((p) => setMovies(Array.isArray(p?.content) ? p.content : []))
      .catch(() => setErr("Không tải được phim"));
  }, []);

  if (Number.isFinite(selectedId) && selectedId > 0) {
    return <PosShowtimesPage movieId={selectedId} />;
  }

  return (
    <div className="page">
      <BookingStepper current={1} />
      <h1>POS — Chọn phim</h1>
      {err && <div className="toast err">{err}</div>}
      <div className="grid">
        {movies.map((m) => (
          <Link className="card" key={m.id} to={`/pos?movie=${m.id}`}>
            <Poster movie={m} />
            <div className="card-body">
              <div><span className="badge">{m.rated}</span><span className="muted">{m.genreName}</span></div>
              <strong>{m.title}</strong>
              <span className="muted">{m.durationMinutes} phút</span>
            </div>
          </Link>
        ))}
        {movies.length === 0 && !err && <p className="muted">Không có phim đang chiếu.</p>}
      </div>
    </div>
  );
}
