import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PrefsInput = z.object({
  timezone: z.string().min(1).max(64),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  place: z.string().max(160).nullable().optional(),
  alert_new_moon: z.boolean(),
  alert_full_moon: z.boolean(),
  alert_retrograde: z.boolean(),
  alert_ingress: z.boolean(),
  ingress_planets: z.array(z.string()).max(9),
  lead_hours: z.number().int().min(1).max(168),
  channel: z.enum(["email", "none"]),
  email: z.string().email().nullable().optional(),
  enabled: z.boolean(),
});

export const getSkyAlertPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sky_alert_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertSkyAlertPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PrefsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("sky_alert_preferences")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listRecentDispatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sky_alert_dispatch")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
