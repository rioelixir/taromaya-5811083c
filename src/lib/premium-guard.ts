import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Subscription removed — only auth is required.
export const requirePremium = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next }) => next());
