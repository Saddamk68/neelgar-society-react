import { useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "neelgar_otp_cooldown:";

function storageKey(email: string) {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

/**
 * Tracks a resend cooldown per email, persisted in localStorage so a page
 * refresh doesn't reset it. This is UX politeness only — real abuse
 * protection (rate limit + OTP invalidation) is enforced server-side.
 */
export function useResendCooldown(email: string, seconds = 60) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function computeRemaining(): number {
    if (!email) return 0;
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return 0;
    const startedAt = Number(raw);
    if (Number.isNaN(startedAt)) return 0;
    const elapsed = (Date.now() - startedAt) / 1000;
    const left = Math.ceil(seconds - elapsed);
    return left > 0 ? left : 0;
  }

  useEffect(() => {
    setRemaining(computeRemaining());
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const left = computeRemaining();
      setRemaining(left);
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  function start() {
    if (!email) return;
    localStorage.setItem(storageKey(email), String(Date.now()));
    setRemaining(seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const left = computeRemaining();
      setRemaining(left);
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);
  }

  return { remainingSeconds: remaining, isActive: remaining > 0, start };
}
