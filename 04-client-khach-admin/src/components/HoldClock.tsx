import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { holdRemainLabel, isHoldExpired, seatMapPath } from "../lib/holdClock";
import { useHoldSession } from "../context/HoldSessionContext";

type Props = {
  expiresAt?: string | null;
  channel: "ONLINE" | "POS";
  showtimeId?: number | null;
  redirectOnExpire?: boolean;
  onExpired?: () => void;
};

export default function HoldClock({
  expiresAt,
  channel,
  showtimeId,
  redirectOnExpire = true,
  onExpired,
}: Props) {
  const [nowTick, setNowTick] = useState(0);
  const nav = useNavigate();
  const { abandon } = useHoldSession();
  const fired = useRef(false);
  void nowTick;

  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fired.current = false;
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt || !isHoldExpired(expiresAt) || fired.current) return;
    fired.current = true;
    onExpired?.();
    void abandon();
    if (redirectOnExpire && showtimeId) {
      nav(seatMapPath(channel, showtimeId), { replace: true });
    }
  }, [expiresAt, nowTick, abandon, channel, nav, onExpired, redirectOnExpire, showtimeId]);

  const clock = holdRemainLabel(expiresAt);
  if (!clock) return null;
  return <p className={clock.startsWith("Hết") ? "toast err" : "muted"}>{clock}</p>;
}
