import { createFileRoute, Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { PageShell, GlassCard } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";

type Post = { title: string; body_md: string; excerpt: string | null; cover_url: string | null; author: string; tags: string[]; published_at: string | null; seo_title: string | null; seo_description: string | null };

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
  head: () => ({ meta: [{ title: "Article — TAROMAYA" }] }),
});

function BlogPost() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase.from("cms_blogs")
      .select("title, body_md, excerpt, cover_url, author, tags, published_at, seo_title, seo_description")
      .eq("slug", slug).eq("published", true).maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setErr(error.message);
        else if (!data) setErr("not_found");
        else setPost(data as Post);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (post?.seo_title) document.title = `${post.seo_title} — TAROMAYA`;
    else if (post?.title) document.title = `${post.title} — TAROMAYA`;
  }, [post]);

  return (
    <PageShell hideAI eyebrow="Journal" title={post?.title ?? (loading ? "Loading…" : "Article")}>
      <Link to="/blog" className="mb-4 inline-flex items-center gap-1 text-xs text-white/60 hover:text-gold"><ArrowLeft className="h-3 w-3" /> All posts</Link>
      {loading && <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {err === "not_found" && <GlassCard><p className="text-pearl">This article doesn't exist.</p></GlassCard>}
      {err && err !== "not_found" && <GlassCard><p className="text-red-300">{err}</p></GlassCard>}
      {post && (
        <>
          {post.cover_url && <img src={post.cover_url} alt="" className="mb-6 w-full max-h-[420px] object-cover rounded-2xl gold-border" />}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span>{post.author}</span>
            {post.published_at && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.published_at).toLocaleDateString()}</span>}
            {post.tags?.length ? <span>#{post.tags.join(" #")}</span> : null}
          </div>
          <GlassCard>
            <article className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown>{post.body_md}</ReactMarkdown>
            </article>
          </GlassCard>
        </>
      )}
    </PageShell>
  );
}
