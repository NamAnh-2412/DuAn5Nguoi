/** Extract an 11-char YouTube video id from watch / youtu.be / embed / shorts URLs. */
export function youtubeId(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  const match = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (match) return match[1];
  try {
    const v = new URL(raw).searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  } catch {
    /* not a URL */
  }
  return null;
}

export function youtubeEmbedSrc(id: string, autoplay = false) {
  return `https://www.youtube.com/embed/${id}${autoplay ? "?autoplay=1" : ""}`;
}
