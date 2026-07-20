import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const redeemStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ context, data }) => {
    const code = data.code.trim().toUpperCase();
    if (!code) throw new Error("Missing invite code");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin
      .from("staff_invites")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) throw error;
    if (!invite) throw new Error("Invalid invite code.");
    if (invite.revoked) throw new Error("This invite has been revoked.");
    if (invite.expires_at && new Date(invite.expires_at) < new Date())
      throw new Error("This invite has expired.");
    if (invite.used_count >= invite.max_uses)
      throw new Error("This invite has already been used the maximum number of times.");

    const userId = context.userId;
    // Grant free 5-year subscription
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 5);
    const { error: subErr } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        { user_id: userId, status: "active", expires_at: expires.toISOString() },
        { onConflict: "user_id" },
      );
    if (subErr) throw subErr;

    // Accept terms so the user can enter the app
    await supabaseAdmin
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", userId);

    // Increment usage
    await supabaseAdmin
      .from("staff_invites")
      .update({ used_count: invite.used_count + 1 })
      .eq("id", invite.id);

    return { ok: true, note: invite.note as string | null };
  });

export const previewStaffInvite = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase();
    if (!code) return { valid: false, reason: "Missing invite code." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("staff_invites")
      .select("id, note, expires_at, max_uses, used_count, revoked")
      .eq("code", code)
      .maybeSingle();
    if (!invite) return { valid: false, reason: "Invalid invite code." };
    if (invite.revoked) return { valid: false, reason: "This invite has been revoked." };
    if (invite.expires_at && new Date(invite.expires_at) < new Date())
      return { valid: false, reason: "This invite has expired." };
    if (invite.used_count >= invite.max_uses)
      return { valid: false, reason: "This invite has already been fully redeemed." };
    return {
      valid: true,
      note: invite.note as string | null,
      remaining: invite.max_uses - invite.used_count,
      expires_at: invite.expires_at as string | null,
    };
  });
