import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KIND = z.enum(["tarot", "ai", "note", "kundli", "horoscope"]);

const CreateInput = z.object({
  kind: KIND,
  title: z.string().min(1).max(140),
  body: z.string().max(20000).optional().default(""),
  mood: z.string().max(24).optional().nullable(),
  tags: z.array(z.string().max(32)).max(20).optional().default([]),
  meta: z.record(z.string(), z.unknown()).optional().default({}),
});

export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: userId,
        kind: data.kind,
        title: data.title,
        body: data.body ?? "",
        mood: data.mood ?? null,
        tags: data.tags ?? [],
        meta: (data.meta ?? {}) as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journal_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("journal_entries")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(140).optional(),
      body: z.string().max(20000).optional(),
      mood: z.string().max(24).nullable().optional(),
      tags: z.array(z.string().max(32)).max(20).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error, data: row } = await context.supabase
      .from("journal_entries")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
