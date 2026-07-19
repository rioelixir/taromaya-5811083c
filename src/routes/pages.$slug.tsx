import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { PageShell, GlassCard } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Page = { title: string; body_md: string; seo_title: string | null; seo_description: string | null; slug: string };

export const Route = createFileRoute("/pages/$slug")({
  component: PageView,
  head: () => ({
    meta: [
      { title: "Page — TAROMAYA" },
      { name: "description", content: "Taromaya info page." },
    ],
  }),
});

function PageView() {
  const { slug } = Route.useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase.from("cms_pages")
      .select("title, body_md, seo_title, seo_description, slug")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setErr(error.message);
        else if (!data) setErr("not_found");
        else setPage(data as Page);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (page?.seo_title) document.title = `${page.seo_title} — TAROMAYA`;
    else if (page?.title) document.title = `${page.title} — TAROMAYA`;
  }, [page]);

  return (
    <PageShell hideAI eyebrow="Taromaya" title={page?.title ?? (loading ? "Loading…" : "Page")}>
      {loading && <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {err === "not_found" && <GlassCard><p className="text-pearl">This page doesn't exist yet.</p></GlassCard>}
      {err && err !== "not_found" && <GlassCard><p className="text-red-300">{err}</p></GlassCard>}
      {page && (
        <GlassCard>
          <article className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown>{page.body_md}</ReactMarkdown>
          </article>
        </GlassCard>
      )}
    </PageShell>
  );
}
