import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BirthProfile = {
  id: string;
  user_id: string;
  full_name: string;
  gender: string | null;
  birth_date: string; // YYYY-MM-DD
  birth_time: string; // HH:MM or HH:MM:SS
  tz_offset_hours: number;
  place: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
};

const SaveSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  gender: z.string().max(24).optional().nullable(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  tz_offset_hours: z.number().min(-14).max(14),
  place: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const getBirthProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BirthProfile | null> => {
    const { data, error } = await context.supabase
      .from("user_birth_profile")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as BirthProfile | null) ?? null;
  });

export const saveBirthProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SaveSchema.parse(input))
  .handler(async ({ data, context }): Promise<BirthProfile> => {
    const row = {
      user_id: context.userId,
      ...data,
      gender: data.gender ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data: out, error } = await context.supabase
      .from("user_birth_profile")
      .upsert(row, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return out as BirthProfile;
  });
