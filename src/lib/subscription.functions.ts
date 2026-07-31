import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Key in app_settings that decides whether the whole app is free or paid. */
export const ACCESS_MODE_KEY = "access_mode";
export type AccessMode = "free" | "paid";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Role check failed");
  if (!data) throw new Error("Forbidden: admin only");
}

/**
 * Public on purpose: every screen needs to know if the app is free right now.
 * Returns nothing but the one word "free" or "paid".
 */
export const getAccessMode = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", ACCESS_MODE_KEY)
    .maybeSingle();
  const raw = (data?.value ?? null) as { mode?: string } | string | null;
  const mode = typeof raw === "string" ? raw : raw?.mode;
  return { mode: (mode === "paid" ? "paid" : "free") as AccessMode };
});

export const adminSetAccessMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { mode: AccessMode }) => {
    if (d.mode !== "free" && d.mode !== "paid") throw new Error("Unknown mode");
    return d;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_settings").upsert({
      key: ACCESS_MODE_KEY,
      value: { mode: data.mode } as any,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });
    if (error) throw error;
    return { ok: true, mode: data.mode };
  });

/** Everyone who has signed up, with whether they currently get paid features. */
export const adminListSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, is_comped, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

export const adminSetUserPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; paid: boolean }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_comped: data.paid, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

/** Give or take paid access for everyone at once. */
export const adminSetPaidForEveryone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { paid: boolean }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_comped: data.paid, updated_at: new Date().toISOString() })
      .not("id", "is", null);
    if (error) throw error;
    return { ok: true };
  });
