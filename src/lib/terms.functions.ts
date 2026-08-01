import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Accounts that never see the Terms & Conditions screen. The check runs on the
 * server against the verified email in the validated access token — never
 * against anything the browser sends.
 */
const TERMS_BYPASS_EMAILS = [
  "taromaya@gmail.com",
  "taromayaexperts@gmail.com",
  "tarotbyriaa@gmail.com",
];

export type TermsStatus = {
  /** true when the user may enter the app without seeing the terms screen */
  satisfied: boolean;
  /** why it was satisfied — "accepted" | "admin" | "allowlisted" | "pending" */
  reason: "accepted" | "admin" | "allowlisted" | "pending";
};

/**
 * Server-side terms gate. Verified admins and allowlisted verified emails are
 * marked as having satisfied the terms and are let straight through.
 */
export const termsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TermsStatus> => {
    const claims = context.claims as Record<string, unknown>;
    const email = typeof claims["email"] === "string" ? (claims["email"] as string).toLowerCase() : "";
    const emailVerified =
      claims["email_verified"] === true ||
      (typeof claims["user_metadata"] === "object" &&
        claims["user_metadata"] !== null &&
        (claims["user_metadata"] as Record<string, unknown>)["email_verified"] === true);

    // Admin role, verified server-side through the user's own RLS-scoped client.
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleRow;
    const isAllowlisted = !!email && emailVerified && TERMS_BYPASS_EMAILS.includes(email);

    if (isAdmin || isAllowlisted) {
      // Persist acceptance so downstream checks are consistent everywhere.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("profiles")
        .update({ terms_accepted_at: new Date().toISOString() })
        .eq("id", context.userId)
        .is("terms_accepted_at", null);
      return { satisfied: true, reason: isAdmin ? "admin" : "allowlisted" };
    }

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("terms_accepted_at")
      .eq("id", context.userId)
      .maybeSingle();

    return profile?.terms_accepted_at
      ? { satisfied: true, reason: "accepted" }
      : { satisfied: false, reason: "pending" };
  });
