import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

// ─── Public: get the active plan (backwards-compat: first active) ──────
export const getActivePlan = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
});

// ─── Public: list all active plans ─────────────────────────────────────
export const getActivePlans = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("price_cents", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

// ─── Admin: list all plans ─────────────────────────────────────────────
export const adminListPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

// ─── Admin: create plan ────────────────────────────────────────────────
export const adminCreatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    slug: string;
    name: string;
    description?: string;
    price_cents: number;
    currency?: string;
    billing_period?: string;
    features?: string[];
    payment_link?: string | null;
    is_active?: boolean;
    tier?: string;
    badge?: string | null;
    highlight?: boolean;
    trial_days?: number;
    sort_order?: number;
  }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("subscription_plans")
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description ?? null,
        price_cents: data.price_cents,
        currency: data.currency ?? "INR",
        billing_period: data.billing_period ?? "monthly",
        features: data.features ?? [],
        payment_link: data.payment_link ?? null,
        is_active: data.is_active ?? true,
        tier: data.tier ?? "standard",
        badge: data.badge ?? null,
        highlight: data.highlight ?? false,
        trial_days: data.trial_days ?? 0,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ─── Admin: delete plan ────────────────────────────────────────────────
export const adminDeletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subscription_plans").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });


// ─── User: my subscription ───────────────────────────────────────────────
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    const isActive =
      !!data &&
      data.status === "active" &&
      (!data.expires_at || new Date(data.expires_at) > new Date());
    return { subscription: data, isPremium: isActive };
  });

// ─── User: request a subscription (pending → admin activates) ────────────
export const requestSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { notes?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const { data: plan } = await context.supabase
      .from("subscription_plans")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    const { error } = await context.supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id: context.userId,
          plan_id: plan?.id ?? null,
          status: "pending",
          notes: data.notes ?? null,
        },
        { onConflict: "user_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

// ─── Admin: update the plan ──────────────────────────────────────────────
export const adminUpdatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      name?: string;
      description?: string;
      price_cents?: number;
      currency?: string;
      billing_period?: string;
      features?: string[];
      payment_link?: string | null;
      is_active?: boolean;
      tier?: string;
      badge?: string | null;
      highlight?: boolean;
      trial_days?: number;
      sort_order?: number;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin
      .from("subscription_plans")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ─── Admin: list subscriptions ───────────────────────────────────────────
export const adminListSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs, error } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const ids = (subs ?? []).map((s: any) => s.user_id);
    let emailMap = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, email, display_name")
        .in("id", ids);
      (profs ?? []).forEach((p: any) => emailMap.set(p.id, p.email ?? p.display_name ?? p.id));
    }
    return (subs ?? []).map((s: any) => ({ ...s, email: emailMap.get(s.user_id) ?? s.user_id }));
  });

// ─── Admin: grant / revoke subscription ──────────────────────────────────
export const adminSetSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      userId: string;
      status: "active" | "pending" | "canceled" | "expired";
      months?: number;
      notes?: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    const now = new Date();
    const expires =
      data.status === "active" && data.months
        ? new Date(now.getFullYear(), now.getMonth() + data.months, now.getDate()).toISOString()
        : data.status === "active"
          ? null
          : null;
    const { error } = await supabaseAdmin.from("user_subscriptions").upsert(
      {
        user_id: data.userId,
        plan_id: plan?.id ?? null,
        status: data.status,
        started_at: data.status === "active" ? now.toISOString() : null,
        expires_at: expires,
        notes: data.notes ?? null,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .delete()
      .eq("user_id", data.userId);
    if (error) throw error;
    return { ok: true };
  });
