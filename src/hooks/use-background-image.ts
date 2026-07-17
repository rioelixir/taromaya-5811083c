import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Reads app.background from app_settings and returns a signed URL for the image (or null). */
export function useBackgroundImage() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function resolve() {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "app.background")
        .maybeSingle();
      const path = (data?.value as any)?.path as string | null | undefined;
      if (!path) { if (mounted) setUrl(null); return; }
      const { data: signed } = await supabase.storage.from("app-assets").createSignedUrl(path, 3600);
      if (mounted) setUrl(signed?.signedUrl ?? null);
    }
    resolve();
    // Refresh signed URL every 50 min
    const t = setInterval(resolve, 50 * 60 * 1000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return url;
}
