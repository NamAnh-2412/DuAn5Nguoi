import type { Movie } from "../api/types";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function posterSrc(movie: Movie) {
  return movie.posterUrl ? `${API}/${movie.posterUrl}` : undefined;
}

export default function Poster({ movie, wide }: { movie: Movie; wide?: boolean }) {
  const src = posterSrc(movie);
  const gold = movie.id % 2 === 1;
  return (
    <div
      className={wide ? "poster-wide" : "poster"}
      style={{
        background: gold
          ? "linear-gradient(155deg, #f5c518 0%, #7a1a28 48%, #140308 100%)"
          : "linear-gradient(155deg, #e31d3c 0%, #5c1020 52%, #0a0206 100%)",
      }}
    >
      {src ? <img src={src} alt={movie.title} /> : wide ? null : <span>{movie.title}</span>}
    </div>
  );
}
