import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAccessMode, type AccessMode } from "@/lib/subscription.functions";

/**
 * Free mode (the default) means everything is open for everyone.
 * Paid mode means only people the admin marked as paid get the extra parts.
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState(true);
  const [mode, setMode] = useState<AccessMode>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { mode: m } = await getAccessMode();
        if (!alive) return;
        setMode(m);
        if (m === "free") { setIsPremium(true); return; }
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) { if (alive) setIsPremium(false); return; }
        const { data } = await supabase.rpc("is_premium", { _user_id: uid });
        if (alive) setIsPremium(!!data);
      } catch {
        // If we cannot check, keep the app open rather than locking people out.
        if (alive) setIsPremium(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { isPremium, mode, loading };
}
