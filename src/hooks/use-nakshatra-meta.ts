import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NAKSHATRA_META_KEY, type NakshatraMetaMap } from "@/lib/nakshatra-deck";

/**
 * Loads the admin-editable extras for the 27 birth-star cards.
 * Nothing is bundled in code — change it in Admin and users see it at once.
 */
export function useNakshatraMeta() {
  const [meta, setMeta] = useState<NakshatraMetaMap>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", NAKSHATRA_META_KEY)
        .maybeSingle();
      setMeta(((data?.value as NakshatraMetaMap | null) ?? {}) as NakshatraMetaMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { meta, loading, reload: load };
}
