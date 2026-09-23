import { youtubeEmbedSrc, youtubeId } from "../lib/youtube";

export default function TrailerModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const id = youtubeId(url);
  if (!id) return null;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="trailer-box" onClick={(e) => e.stopPropagation()}>
        <div className="trailer-box-head">
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title} — Trailer
          </div>
          <button type="button" className="chip" onClick={onClose}>Đóng</button>
        </div>
        <div className="trailer-frame">
          <iframe
            title={`${title} trailer`}
            src={youtubeEmbedSrc(id, true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
