/** Fixed nebula + star field behind the whole app. */
export default function GalaxySky() {
  return (
    <div className="galaxy-sky" aria-hidden>
      <div className="galaxy-nebula" />
      <div className="galaxy-stars galaxy-stars-a" />
      <div className="galaxy-stars galaxy-stars-b" />
      <span className="galaxy-shoot" />
    </div>
  );
}
