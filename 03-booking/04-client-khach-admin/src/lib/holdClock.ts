export function holdRemainMs(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).getTime() - Date.now();
}

export function isHoldExpired(iso?: string | null) {
  const ms = holdRemainMs(iso);
  return ms !== null && ms <= 0;
}

export function holdRemainLabel(iso?: string | null) {
  const ms = holdRemainMs(iso);
  if (ms === null) return "";
  if (ms <= 0) return "Hết hạn giữ ghế";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `Giữ ghế còn ${m}:${String(s).padStart(2, "0")}`;
}

export function seatMapPath(channel: "ONLINE" | "POS", showtimeId: number) {
  return channel === "POS" ? `/pos/book/${showtimeId}` : `/book/${showtimeId}`;
}

export function saleHomePath(channel: "ONLINE" | "POS") {
  return channel === "POS" ? "/pos" : "/";
}

export function isHoldFlowPath(pathname: string) {
  return /^\/(?:pos\/)?(?:book|concessions|checkout)\//.test(pathname);
}

export function isPostSalePath(pathname: string) {
  return pathname.startsWith("/pos/print/") || pathname === "/tickets";
}

export function bookShowtimeId(pathname: string) {
  const m = pathname.match(/\/book\/(\d+)/);
  return m ? Number(m[1]) : null;
}
