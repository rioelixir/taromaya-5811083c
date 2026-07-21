import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side premium/subscription check. Depends on requireSupabaseAuth.
 * Uses the `public.is_premium(uuid)` SQL function which returns true for
 * admins, comped accounts, and users with an active subscription.
 * Throws "Forbidden: Premium required" for free users.
 */
export const requirePremium = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("is_premium", { _user_id: userId });
    if (error) throw new Error(`Premium check failed: ${error.message}`);
    if (!data) throw new Error("Forbidden: Premium subscription required");
    return next();
  });
