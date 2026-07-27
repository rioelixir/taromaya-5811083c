import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type PaywallConfig = {
  enabled: boolean;
  amount_inr: number;
  upi_id: string;
  payee_name: string;
  qr_url: string;
  note: string;
};

const DEFAULTS: PaywallConfig = {
  enabled: false,
  amount_inr: 1973,
  upi_id: "",
  payee_name: "TAROMAYA",
  qr_url: "",
  note: "Scan the QR or pay via UPI. Your access will unlock once payment is verified.",
};

export function usePaywallConfig() {
  const [config, setConfig] = useState<PaywallConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "app.paywall")
      .maybeSingle();
    const v = (data?.value ?? {}) as Partial<PaywallConfig>;
    setConfig({ ...DEFAULTS, ...v });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { config, loading, reload: load };
}

/** Returns whether the current user has premium/comped/admin access via RPC. */
export function useHasAccess() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase.rpc("is_premium", { _user_id: user.id }).then(({ data }) => {
      if (!mounted) return;
      setHasAccess(!!data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  return { hasAccess, loading, userId: user?.id ?? null };
}
