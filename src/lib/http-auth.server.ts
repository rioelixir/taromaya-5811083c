import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Verify a Bearer token from an HTTP request and (optionally) check premium.
 * Returns { userId } on success, or a Response to return immediately on failure.
 */
export async function requireHttpAuth(
  request: Request,
  opts: { premium?: boolean } = {},
): Promise<{ userId: string } | Response> {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return new Response("Unauthorized", { status: 401 });

  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supaUrl || !supaKey) return new Response("Server misconfigured", { status: 500 });

  const supa = createClient<Database>(supaUrl, supaKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (supaKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${supaKey}`) {
          h.delete("Authorization");
        }
        h.set("apikey", supaKey);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data: userData, error } = await supa.auth.getUser(token);
  if (error || !userData?.user) return new Response("Unauthorized", { status: 401 });
  const userId = userData.user.id;

  if (opts.premium) {
    const { data: premium, error: pErr } = await supa.rpc("is_premium", { _user_id: userId });
    if (pErr) return new Response("Premium check failed", { status: 500 });
    if (!premium) return new Response("Forbidden: Premium subscription required", { status: 403 });
  }

  return { userId };
}
