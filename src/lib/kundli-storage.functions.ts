import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveInput = z.object({
  name: z.string().min(1).max(80),
  birthDate: z.string(),
  birthTime: z.string(),
  tzOffset: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  place: z.string().max(120).optional().default(""),
});

export const saveKundli = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, data: row } = await supabase
      .from("saved_kundlis")
      .insert({
        user_id: userId,
        name: data.name,
        birth_date: data.birthDate,
        birth_time: data.birthTime,
        tz_offset: data.tzOffset,
        latitude: data.latitude,
        longitude: data.longitude,
        place: data.place,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listKundlis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_kundlis")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteKundli = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_kundlis")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
