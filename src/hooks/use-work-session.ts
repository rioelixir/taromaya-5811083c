import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  startWorkSession,
  heartbeatWorkSession,
  endWorkSession,
  myAccessStatus,
} from "@/lib/employee.functions";

const KEY = "taromaya_work_session";
const BEAT_MS = 3 * 60 * 1000; // keep-alive well inside the 15 minute window

export type AccessStatus = {
  isEmployee: boolean;
  hasLiveSession: boolean;
  employeeAccessActive: boolean;
  isPremium: boolean;
};

/** Ends the current work session. Safe to call even if there is none. */
export async function closeWorkSession() {
  if (typeof window === "undefined") return;
  const id = window.sessionStorage.getItem(KEY);
  window.sessionStorage.removeItem(KEY);
  if (!id) return;
  try {
    await endWorkSession({ data: { sessionId: id } });
  } catch {
    // Signing out matters more than tidying the record.
  }
}

/**
 * Starts a work session for the signed-in person and keeps it alive.
 * The server decides what the session unlocks; this only reports it.
 */
export function useWorkSession() {
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await myAccessStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const stop = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    const begin = async () => {
      try {
        const device =
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : undefined;
        const { sessionId } = await startWorkSession({ data: { device } });
        if (!alive) return;
        window.sessionStorage.setItem(KEY, sessionId);
        await refresh();

        stop();
        timer.current = setInterval(async () => {
          const id = window.sessionStorage.getItem(KEY);
          if (!id) return;
          try {
            const { active } = await heartbeatWorkSession({ data: { sessionId: id } });
            if (!active) {
              // Session was revoked or ran out — access drops back automatically.
              window.sessionStorage.removeItem(KEY);
              stop();
              await refresh();
            }
          } catch {
            /* offline: try again next beat */
          }
        }, BEAT_MS);
      } catch {
        /* not signed in yet */
      } finally {
        if (alive) setLoading(false);
      }
    };

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      if (!data.user) {
        setLoading(false);
        return;
      }
      await begin();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        window.sessionStorage.removeItem(KEY);
        stop();
        setStatus(null);
        return;
      }
      if (event === "SIGNED_IN" && session?.user) void begin();
    });

    return () => {
      alive = false;
      stop();
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  return { status, loading, refresh };
}
