// Server functions for the "How to Use TAROMAYA" tutorials. Users get read
// access to published rows; admins can list all + create/update/delete.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Tutorial = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  language: "en" | "hi" | "hi-roman";
  video_url: string;
  captions_url: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
  published: boolean;
  updated_at: string;
};

export const listTutorials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Tutorial[]> => {
    const { data, error } = await context.supabase
      .from("tutorials")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Tutorial[];
  });

export const upsertTutorial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<Tutorial> & { title: string; slug: string; language: Tutorial["language"]; video_url: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const row = {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description ?? null,
      language: data.language,
      video_url: data.video_url,
      captions_url: data.captions_url ?? null,
      poster_url: data.poster_url ?? null,
      duration_seconds: data.duration_seconds ?? null,
      sort_order: data.sort_order ?? 0,
      published: data.published ?? true,
    };
    const { data: saved, error } = await context.supabase
      .from("tutorials")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return saved as Tutorial;
  });

export const deleteTutorial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase.from("tutorials").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });
