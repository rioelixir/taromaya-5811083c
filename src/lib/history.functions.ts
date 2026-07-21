import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HistoryItem = {
  id: string;
  kind: "kundli" | "pdf" | "journal";
  label: string;
  sublabel?: string;
  createdAt: string;
};

export const getHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [kundlis, pdfs, journals] = await Promise.all([
      supabase
        .from("saved_kundlis")
        .select("id, name, place, birth_date, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("pdf_downloads")
        .select("id, kind, label, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("journal_entries")
        .select("id, kind, title, mood, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const items: HistoryItem[] = [];
    for (const k of kundlis.data ?? []) {
      items.push({
        id: `k-${k.id}`,
        kind: "kundli",
        label: `Kundli · ${k.name}`,
        sublabel: [k.place, k.birth_date].filter(Boolean).join(" · "),
        createdAt: k.created_at,
      });
    }
    for (const p of pdfs.data ?? []) {
      items.push({
        id: `p-${p.id}`,
        kind: "pdf",
        label: `PDF · ${p.label ?? p.kind}`,
        sublabel: `${p.kind} report`,
        createdAt: p.created_at,
      });
    }
    for (const j of journals.data ?? []) {
      items.push({
        id: `j-${j.id}`,
        kind: "journal",
        label: `${j.kind[0].toUpperCase()}${j.kind.slice(1)} · ${j.title}`,
        sublabel: j.mood ?? undefined,
        createdAt: j.created_at,
      });
    }

    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return items.slice(0, 100);
  });
