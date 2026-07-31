import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2, Newspaper, Calendar } from "lucide-react";

type BlogListItem = { id: string; slug: string; title: string; excerpt: string | null; cover_url: string | null; author: string; tags: string[]; published_at: string | null };

export const Route = createFileRoute("/blog")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: "Blog — TAROMAYA" },
      { name: "description", content: "Articles on tarot, astrology, and inner wisdom." },
    ],
  }),
});

function BlogIndex() {
  const [rows, setRows] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("cms_blogs")
      .select("id, slug, title, excerpt, cover_url, author, tags, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .then(({ data }) => { setRows((data ?? []) as BlogListItem[]); setLoading(false); });
  }, []);

  return (
    <PageShell hideAI hideVoice eyebrow="Journal" title="The Taromaya Blog" subtitle="Wisdom on tarot, astrology, and the cosmic within.">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : !rows.length ? (
        <GlassCard><p className="text-pearl">No posts yet — check back soon.</p></GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map(r => (
            <Link key={r.id} to="/blog/$slug" params={{ slug: r.slug }} className="group">
              <GlassCard className="h-full overflow-hidden p-0 transition group-hover:brightness-110">
                {r.cover_url ? (
                  <img src={r.cover_url} alt="" className="h-40 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-40 w-full grid place-items-center bg-gradient-to-br from-galaxy/20 to-gold/10">
                    <Newspaper className="h-8 w-8 text-white/40" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg text-pearl group-hover:text-gold transition">{r.title}</h3>
                  {r.excerpt && <p className="mt-1 text-sm text-white/70 line-clamp-3">{r.excerpt}</p>}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-white/50">
                    <span>{r.author}</span>
                    {r.published_at && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.published_at).toLocaleDateString()}</span>}
                    {r.tags?.length ? <span className="truncate">#{r.tags.slice(0, 3).join(" #")}</span> : null}
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
