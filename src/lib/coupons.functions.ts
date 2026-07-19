import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  discount_amount_cents: number;
  currency: string;
  max_redemptions: number | null;
  times_redeemed: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Admin: list ────────────────────────────────────────────────────────
export const adminListCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Coupon[];
  });

// ─── Admin: create ──────────────────────────────────────────────────────
export const adminCreateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<Coupon> & { code: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: data.code.trim().toUpperCase(),
        description: data.description ?? null,
        discount_percent: data.discount_percent ?? 0,
        discount_amount_cents: data.discount_amount_cents ?? 0,
        currency: data.currency ?? "INR",
        max_redemptions: data.max_redemptions ?? null,
        valid_from: data.valid_from ?? null,
        valid_until: data.valid_until ?? null,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ─── Admin: update ──────────────────────────────────────────────────────
export const adminUpdateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string } & Partial<Coupon>) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, code, times_redeemed: _ignore, created_at: _ignore2, updated_at: _ignore3, ...rest } = data as any;
    const patch: any = { ...rest };
    if (code) patch.code = String(code).trim().toUpperCase();
    const { error } = await supabaseAdmin.from("coupons").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ─── Admin: delete ──────────────────────────────────────────────────────
export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ─── User: validate coupon against a plan price ─────────────────────────
export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; planId: string }) => d)
  .handler(async ({ context, data }) => {
    const code = data.code.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: coupon }, { data: plan }] = await Promise.all([
      supabaseAdmin.from("coupons").select("*").eq("code", code).maybeSingle(),
      supabaseAdmin.from("subscription_plans").select("*").eq("id", data.planId).maybeSingle(),
    ]);
    if (!coupon || !coupon.is_active) return { ok: false as const, reason: "Invalid or inactive code" };
    if (!plan) return { ok: false as const, reason: "Plan not found" };
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) return { ok: false as const, reason: "Not yet valid" };
    if (coupon.valid_until && new Date(coupon.valid_until) < now) return { ok: false as const, reason: "Expired" };
    if (coupon.max_redemptions !== null && coupon.times_redeemed >= coupon.max_redemptions) {
      return { ok: false as const, reason: "Redemption limit reached" };
    }
    const base = plan.price_cents as number;
    const pctOff = Math.round((base * (coupon.discount_percent || 0)) / 100);
    const amtOff = coupon.discount_amount_cents || 0;
    const totalOff = Math.min(base, pctOff + amtOff);
    const finalPrice = Math.max(0, base - totalOff);
    return {
      ok: true as const,
      couponId: coupon.id as string,
      code: coupon.code as string,
      amountOffCents: totalOff,
      finalPriceCents: finalPrice,
      currency: plan.currency as string,
      // silence unused-var TS complaints
      _u: [context.userId],
    };
  });
