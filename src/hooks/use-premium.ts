import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        if (mounted) { setIsPremium(false); setLoading(false); }
        return;
      }
      // admin bypass
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleRow) {
        if (mounted) { setIsPremium(true); setLoading(false); }
        return;
      }
      // comped (admin-created free-access) bypass
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_comped")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.is_comped) {
        if (mounted) { setIsPremium(true); setLoading(false); }
        return;
      }
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      const active =
        !!sub &&
        sub.status === "active" &&
        (!sub.expires_at || new Date(sub.expires_at) > new Date());
      if (mounted) { setIsPremium(active); setLoading(false); }
    }

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { isPremium, loading };
}
