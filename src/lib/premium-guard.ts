import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Payments removed — only auth is required. Kept as a re-export for existing
// server-function imports so we don't have to touch every callsite.
export const requirePremium = requireSupabaseAuth;
