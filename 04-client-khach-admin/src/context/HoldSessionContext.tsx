import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cancelHold } from "../api/bookingApi";
import { bookShowtimeId, isHoldFlowPath, isPostSalePath } from "../lib/holdClock";

export type HoldSession = {
  reservationId: number;
  showtimeId: number;
  channel: "ONLINE" | "POS";
  expiresAt: string | null;
};

const KEY = "vx_hold";

type Ctx = {
  session: HoldSession | null;
  track: (next: HoldSession) => void;
  release: () => void;
  abandon: () => Promise<void>;
};

const HoldSessionContext = createContext<Ctx | null>(null);

function read(): HoldSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as HoldSession;
    if (!v?.reservationId || !v?.showtimeId) return null;
    return v;
  } catch {
    return null;
  }
}

export function HoldSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<HoldSession | null>(read);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const persist = useCallback((next: HoldSession | null) => {
    sessionRef.current = next;
    setSession(next);
    if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
    else sessionStorage.removeItem(KEY);
  }, []);

  const track = useCallback((next: HoldSession) => persist(next), [persist]);
  const release = useCallback(() => persist(null), [persist]);
  const abandon = useCallback(async () => {
    const cur = sessionRef.current;
    persist(null);
    if (!cur) return;
    try {
      await cancelHold(cur.reservationId);
    } catch {
      /* hold may already be expired / confirmed */
    }
  }, [persist]);

  const value = useMemo<Ctx>(
    () => ({ session, track, release, abandon }),
    [session, track, release, abandon],
  );

  return <HoldSessionContext.Provider value={value}>{children}</HoldSessionContext.Provider>;
}

export function useHoldSession() {
  const ctx = useContext(HoldSessionContext);
  if (!ctx) throw new Error("HoldSessionProvider missing");
  return ctx;
}

/** Cancel an open hold when leaving the sale flow (nav, logo, other POS pages). */
export function HoldFlowGuard() {
  const loc = useLocation();
  const { session, abandon, release } = useHoldSession();
  const prev = useRef(loc.pathname);

  useEffect(() => {
    const from = prev.current;
    const to = loc.pathname;
    prev.current = to;
    if (from === to) return;
    if (!session) return;
    if (isPostSalePath(to)) {
      release();
      return;
    }
    const nextShow = bookShowtimeId(to);
    if (nextShow && nextShow !== session.showtimeId) {
      void abandon();
      return;
    }
    if (isHoldFlowPath(from) && !isHoldFlowPath(to)) {
      void abandon();
    }
  }, [loc.pathname, session, abandon, release]);

  return null;
}

export function useAbandonSale(channel: "ONLINE" | "POS") {
  const { abandon } = useHoldSession();
  const nav = useNavigate();
  return async () => {
    await abandon();
    nav(channel === "POS" ? "/pos" : "/");
  };
}
