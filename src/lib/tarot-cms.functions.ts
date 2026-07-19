import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

// ---------- Read (any signed-in user) ----------

export const listActiveDecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tarot_decks")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const listDeckCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deckId: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("tarot_cards")
      .select("*")
      .eq("deck_id", data.deckId)
      .eq("is_active", true)
      .order("position", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

// ---------- Admin: decks ----------

export const adminListDecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("tarot_decks")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const DeckSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  short_name: z.string().max(60).optional().nullable(),
  tagline: z.string().max(240).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  author: z.string().max(120).optional().nullable(),
  publisher: z.string().max(120).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
  difficulty: z.string().max(30).optional().nullable(),
  accent: z.string().max(20).optional().nullable(),
  glyph: z.string().max(4).optional().nullable(),
  card_back_url: z.string().url().max(1000).optional().nullable(),
  cover_url: z.string().url().max(1000).optional().nullable(),
  thumbnail_url: z.string().url().max(1000).optional().nullable(),
  guidebook_pdf_url: z.string().url().max(1000).optional().nullable(),
  keywords: z.array(z.string().max(40)).max(40).optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
  is_premium: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

export const adminSaveDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeckSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("tarot_decks")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("tarot_decks")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const adminDeleteDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tarot_decks").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Admin: cards ----------

export const adminListCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deckId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("tarot_cards")
      .select("*")
      .eq("deck_id", data.deckId)
      .order("position", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

const CardSchema = z.object({
  id: z.string().uuid().optional(),
  deck_id: z.string().uuid(),
  position: z.number().int().min(0).max(9999).optional(),
  name: z.string().min(1).max(160),
  arcana: z.string().max(30).optional().nullable(),
  suit: z.string().max(30).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  element: z.string().max(30).optional().nullable(),
  planet: z.string().max(30).optional().nullable(),
  zodiac: z.string().max(30).optional().nullable(),
  chakra: z.string().max(30).optional().nullable(),
  crystal: z.string().max(60).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  keywords: z.array(z.string().max(40)).max(40).optional(),
  meaning_upright: z.string().max(4000).optional().nullable(),
  meaning_reversed: z.string().max(4000).optional().nullable(),
  advice: z.string().max(2000).optional().nullable(),
  love: z.string().max(2000).optional().nullable(),
  career: z.string().max(2000).optional().nullable(),
  finance: z.string().max(2000).optional().nullable(),
  health: z.string().max(2000).optional().nullable(),
  spiritual: z.string().max(2000).optional().nullable(),
  timing: z.string().max(500).optional().nullable(),
  affirmation: z.string().max(500).optional().nullable(),
  journal_prompt: z.string().max(500).optional().nullable(),
  meditation: z.string().max(2000).optional().nullable(),
  front_image_url: z.string().url().max(1000).optional().nullable(),
  back_image_url: z.string().url().max(1000).optional().nullable(),
  audio_url: z.string().url().max(1000).optional().nullable(),
  tags: z.array(z.string().max(40)).max(40).optional(),
  is_active: z.boolean().optional(),
});

export const adminSaveCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CardSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("tarot_cards")
        .update(data)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("tarot_cards")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const adminDeleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tarot_cards").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Admin: AI prompts ----------

export const adminListPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("ai_prompts")
      .select("*")
      .order("key", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const adminListPromptVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { promptId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("prompt_id", data.promptId)
      .order("version", { ascending: false })
      .limit(50);
    if (error) throw error;
    return rows ?? [];
  });

const PromptSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(160),
  description: z.string().max(1000).optional().nullable(),
  system_prompt: z.string().max(8000),
  user_template: z.string().max(8000),
  model: z.string().min(1).max(120),
  temperature: z.number().min(0).max(2),
  max_output_tokens: z.number().int().min(1).max(200000).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const adminSavePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PromptSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      // fetch current for version snapshot
      const { data: existing } = await context.supabase
        .from("ai_prompts")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (existing) {
        await context.supabase.from("ai_prompt_versions").insert({
          prompt_id: existing.id,
          version: existing.version,
          system_prompt: existing.system_prompt,
          user_template: existing.user_template,
          model: existing.model,
          temperature: existing.temperature,
          saved_by: context.userId,
        });
      }
      const { data: row, error } = await context.supabase
        .from("ai_prompts")
        .update({
          ...data,
          version: (existing?.version ?? 1) + 1,
          updated_by: context.userId,
        })
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("ai_prompts")
      .insert({ ...data, updated_by: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const adminDeletePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ai_prompts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Public read for a prompt by key (used by AI callers)
export const getPromptByKey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("ai_prompts")
      .select("key, label, system_prompt, user_template, model, temperature, is_active")
      .eq("key", data.key)
      .eq("is_active", true)
      .maybeSingle();
    return row ?? null;
  });
