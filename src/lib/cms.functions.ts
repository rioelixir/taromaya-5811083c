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

// ============ PAGES ============
const PageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase, digits, hyphens"),
  title: z.string().min(1).max(200),
  body_md: z.string().default(""),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(400).nullable().optional(),
  published: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const adminListPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("cms_pages").select("*").order("sort_order").order("created_at");
    if (error) throw error;
    return data ?? [];
  });

export const adminSavePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PageSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...row } = data;
    const q = id
      ? context.supabase.from("cms_pages").update(row).eq("id", id).select().single()
      : context.supabase.from("cms_pages").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw error;
    return saved;
  });

export const adminDeletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("cms_pages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ FAQS ============
const FaqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1).max(400),
  answer_md: z.string().default(""),
  category: z.string().min(1).max(80).default("General"),
  sort_order: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const adminListFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("cms_faqs").select("*").order("category").order("sort_order");
    if (error) throw error;
    return data ?? [];
  });

export const adminSaveFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FaqSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...row } = data;
    const q = id
      ? context.supabase.from("cms_faqs").update(row).eq("id", id).select().single()
      : context.supabase.from("cms_faqs").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw error;
    return saved;
  });

export const adminDeleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("cms_faqs").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ BLOGS ============
const BlogSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/, "lowercase, digits, hyphens"),
  title: z.string().min(1).max(240),
  excerpt: z.string().max(600).nullable().optional(),
  body_md: z.string().default(""),
  cover_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  author: z.string().min(1).max(120).default("Taromaya"),
  tags: z.array(z.string().max(40)).default([]),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(400).nullable().optional(),
  published: z.boolean().default(false),
  published_at: z.string().datetime().nullable().optional(),
});

export const adminListBlogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("cms_blogs").select("*").order("published_at", { ascending: false, nullsFirst: true }).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminSaveBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BlogSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const row: any = { ...data };
    delete row.id;
    if (row.published && !row.published_at) row.published_at = new Date().toISOString();
    const q = data.id
      ? context.supabase.from("cms_blogs").update(row).eq("id", data.id).select().single()
      : context.supabase.from("cms_blogs").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw error;
    return saved;
  });

export const adminDeleteBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("cms_blogs").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
