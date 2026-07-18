import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MeditationPreset = {
  id: string;
  name: string;
  planet: string;
  inhale_ms: number;
  hold_in_ms: number;
  exhale_ms: number;
  hold_out_ms: number;
  target_reps: number;
  ambient: string;
  ambient_volume: number;
  mantra_volume: number;
  guided: boolean;
  loop_mantra: boolean;
  created_at: string;
  updated_at: string;
};

export const listMeditationPresets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("meditation_presets")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MeditationPreset[];
  });

type SaveInput = Omit<MeditationPreset, "id" | "created_at" | "updated_at"> & { id?: string };

export const saveMeditationPreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: SaveInput) => v)
  .handler(async ({ data, context }) => {
    const row = { ...data, user_id: context.userId };
    if (data.id) {
      const { data: r, error } = await context.supabase
        .from("meditation_presets")
        .update(row)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return r as MeditationPreset;
    }
    const { data: r, error } = await context.supabase
      .from("meditation_presets")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return r as MeditationPreset;
  });

export const deleteMeditationPreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => v)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("meditation_presets")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
