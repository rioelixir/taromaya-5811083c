import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  tz_offset: z.number().min(-14).max(14),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  place: z.string().trim().max(120).optional(),
  kind: z.string().max(32).default("kundli"),
  expires_in_days: z.number().int().min(1).max(365).optional(),
});

function makeToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
}

export const createShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const token = makeToken();
    const expires_at =
      data.expires_in_days != null
        ? new Date(Date.now() + data.expires_in_days * 86_400_000).toISOString()
        : null;

    const { data: row, error } = await context.supabase
      .from("shared_reports")
      .insert({
        token,
        user_id: context.userId,
        display_name: data.display_name,
        birth_date: data.birth_date,
        birth_time: data.birth_time.length === 5 ? `${data.birth_time}:00` : data.birth_time,
        tz_offset: data.tz_offset,
        latitude: data.latitude,
        longitude: data.longitude,
        place: data.place ?? null,
        kind: data.kind,
        expires_at,
      })
      .select("token, expires_at")
      .single();

    if (error) throw new Error(error.message);
    return { token: row.token, expires_at: row.expires_at };
  });

export const listMyShares = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shared_reports")
      .select("id, token, display_name, kind, views, created_at, expires_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("shared_reports")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type PublicShare = {
  token: string;
  display_name: string;
  birth_date: string;
  birth_time: string;
  tz_offset: number;
  latitude: number;
  longitude: number;
  place: string | null;
  kind: string;
  views: number;
  created_at: string;
  expires_at: string | null;
};

export const getPublicShare = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(4).max(64) }).parse(input))
  .handler(async ({ data }): Promise<PublicShare | null> => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: row, error } = await supabase
      .from("shared_reports")
      .select("token, display_name, birth_date, birth_time, tz_offset, latitude, longitude, place, kind, views, created_at, expires_at")
      .eq("token", data.token)
      .maybeSingle();

    if (error || !row) return null;
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;

    // Best-effort view increment; ignore errors.
    void supabase.rpc; // hint for tree-shaking safety
    await supabase
      .from("shared_reports")
      .update({ views: (row.views ?? 0) + 1 })
      .eq("token", data.token);

    return row as PublicShare;
  });
