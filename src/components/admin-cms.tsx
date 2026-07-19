import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Save, Trash2, FileText, HelpCircle, Newspaper, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { GlassCard } from "@/components/page-shell";
import {
  adminListPages, adminSavePage, adminDeletePage,
  adminListFaqs, adminSaveFaq, adminDeleteFaq,
  adminListBlogs, adminSaveBlog, adminDeleteBlog,
} from "@/lib/cms.functions";

const inputCls = "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-pearl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold/60";
const btnPrimary = "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold/30 to-galaxy/20 gold-border px-4 py-2 text-sm text-pearl hover:brightness-110";
const btnGhost = "inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-pearl/80 hover:bg-white/5";
const btnDanger = "inline-flex items-center gap-2 rounded-full border border-red-400/40 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10";

type PageRow = { id?: string; slug: string; title: string; body_md: string; seo_title: string | null; seo_description: string | null; published: boolean; sort_order: number };
type FaqRow = { id?: string; question: string; answer_md: string; category: string; sort_order: number; published: boolean };
type BlogRow = { id?: string; slug: string; title: string; excerpt: string | null; body_md: string; cover_url: string | null; author: string; tags: string[]; seo_title: string | null; seo_description: string | null; published: boolean; published_at: string | null };

function MarkdownEditor({ value, onChange, rows = 14 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="rounded-lg border border-white/15 bg-black/30">
      <div className="flex items-center justify-between border-b border-white/10 px-2 py-1">
        <span className="text-[11px] uppercase tracking-wider text-white/50">Markdown</span>
        <button type="button" onClick={() => setPreview(p => !p)} className="rounded-md px-2 py-1 text-xs text-gold hover:bg-white/5">
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="prose prose-invert prose-sm max-w-none px-3 py-3 min-h-[200px]">
          <ReactMarkdown>{value || "*Nothing to preview yet.*"}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="w-full resize-y bg-transparent px-3 py-2 text-sm font-mono text-pearl outline-none"
          placeholder="# Heading&#10;&#10;Write in markdown. **Bold**, *italic*, [links](https://…), - lists."
        />
      )}
    </div>
  );
}

// ============= PAGES =============
export function AdminPagesTab() {
  const list = useServerFn(adminListPages);
  const save = useServerFn(adminSavePage);
  const del = useServerFn(adminDeletePage);
  const [rows, setRows] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { setRows((await list()) as PageRow[]); } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const blank = (): PageRow => ({ slug: "", title: "", body_md: "", seo_title: "", seo_description: "", published: true, sort_order: 0 });

  const submit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await save({ data: editing as any });
      setEditing(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-pearl">Pages</h2>
          <p className="text-xs text-white/60">About, Privacy, Terms, Refund, Contact — visible at <code>/pages/&lt;slug&gt;</code>.</p>
        </div>
        <button onClick={() => setEditing(blank())} className={btnPrimary}><Plus className="h-4 w-4" /> New page</button>
      </div>

      {loading ? <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> : (
        <div className="grid gap-3">
          {rows.map(r => (
            <GlassCard key={r.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold" />
                  <div className="truncate text-pearl">{r.title}</div>
                  <code className="text-[11px] text-white/50">/{r.slug}</code>
                  {!r.published && <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/60">DRAFT</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing({ ...r })} className={btnGhost}>Edit</button>
                <button onClick={async () => { if (confirm(`Delete "${r.title}"?`)) { await del({ data: { id: r.id! } }); refresh(); } }} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </GlassCard>
          ))}
          {!rows.length && <div className="text-sm text-white/60">No pages yet.</div>}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Edit page" : "New page"}>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs text-white/60">Title</span><input className={inputCls} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">Slug (URL)</span><input className={inputCls} value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="about" /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">SEO title</span><input className={inputCls} value={editing.seo_title ?? ""} onChange={e => setEditing({ ...editing, seo_title: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">SEO description</span><input className={inputCls} value={editing.seo_description ?? ""} onChange={e => setEditing({ ...editing, seo_description: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">Sort order</span><input type="number" className={inputCls} value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} /></label>
              <label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /><span className="text-sm text-pearl">Published</span></label>
            </div>
            <div>
              <span className="mb-1 block text-xs text-white/60">Body</span>
              <MarkdownEditor value={editing.body_md} onChange={v => setEditing({ ...editing, body_md: v })} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
              <button onClick={submit} disabled={saving} className={btnPrimary}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============= FAQ =============
export function AdminFaqsTab() {
  const list = useServerFn(adminListFaqs);
  const save = useServerFn(adminSaveFaq);
  const del = useServerFn(adminDeleteFaq);
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => { setLoading(true); try { setRows((await list()) as FaqRow[]); } finally { setLoading(false); } };
  useEffect(() => { refresh(); }, []);

  const blank = (): FaqRow => ({ question: "", answer_md: "", category: "General", sort_order: 0, published: true });

  const submit = async () => {
    if (!editing) return;
    setSaving(true);
    try { await save({ data: editing as any }); setEditing(null); await refresh(); }
    catch (e: any) { alert(e?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-pearl">FAQs</h2>
          <p className="text-xs text-white/60">Grouped by category, visible at <code>/faq</code>.</p>
        </div>
        <button onClick={() => setEditing(blank())} className={btnPrimary}><Plus className="h-4 w-4" /> New FAQ</button>
      </div>

      {loading ? <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> : (
        <div className="grid gap-2">
          {rows.map(r => (
            <GlassCard key={r.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-gold" />
                  <div className="truncate text-pearl">{r.question}</div>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60">{r.category}</span>
                  {!r.published && <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/50">DRAFT</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing({ ...r })} className={btnGhost}>Edit</button>
                <button onClick={async () => { if (confirm("Delete this FAQ?")) { await del({ data: { id: r.id! } }); refresh(); } }} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </GlassCard>
          ))}
          {!rows.length && <div className="text-sm text-white/60">No FAQs yet.</div>}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Edit FAQ" : "New FAQ"}>
          <div className="grid gap-3">
            <label className="block"><span className="mb-1 block text-xs text-white/60">Question</span><input className={inputCls} value={editing.question} onChange={e => setEditing({ ...editing, question: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs text-white/60">Category</span><input className={inputCls} value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">Sort order</span><input type="number" className={inputCls} value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} /></label>
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /><span className="text-sm text-pearl">Published</span></label>
            <div>
              <span className="mb-1 block text-xs text-white/60">Answer</span>
              <MarkdownEditor value={editing.answer_md} onChange={v => setEditing({ ...editing, answer_md: v })} rows={8} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
              <button onClick={submit} disabled={saving} className={btnPrimary}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============= BLOGS =============
export function AdminBlogsTab() {
  const list = useServerFn(adminListBlogs);
  const save = useServerFn(adminSaveBlog);
  const del = useServerFn(adminDeleteBlog);
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogRow | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => { setLoading(true); try { setRows((await list()) as BlogRow[]); } finally { setLoading(false); } };
  useEffect(() => { refresh(); }, []);

  const blank = (): BlogRow => ({ slug: "", title: "", excerpt: "", body_md: "", cover_url: "", author: "Taromaya", tags: [], seo_title: "", seo_description: "", published: false, published_at: null });

  const submit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: any = { ...editing };
      if (payload.cover_url === "") payload.cover_url = null;
      await save({ data: payload });
      setEditing(null);
      await refresh();
    } catch (e: any) { alert(e?.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-pearl">Blog</h2>
          <p className="text-xs text-white/60">Long-form articles, visible at <code>/blog</code>.</p>
        </div>
        <button onClick={() => setEditing(blank())} className={btnPrimary}><Plus className="h-4 w-4" /> New post</button>
      </div>

      {loading ? <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> : (
        <div className="grid gap-3">
          {rows.map(r => (
            <GlassCard key={r.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                {r.cover_url ? <img src={r.cover_url} alt="" className="h-12 w-16 rounded-md object-cover border border-white/10" /> : <div className="h-12 w-16 rounded-md border border-white/10 grid place-items-center"><Newspaper className="h-4 w-4 text-white/40" /></div>}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-pearl">{r.title}</div>
                    {!r.published && <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/50">DRAFT</span>}
                  </div>
                  <div className="text-[11px] text-white/50">/{r.slug} · {r.author}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing({ ...r })} className={btnGhost}>Edit</button>
                <button onClick={async () => { if (confirm(`Delete "${r.title}"?`)) { await del({ data: { id: r.id! } }); refresh(); } }} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </GlassCard>
          ))}
          {!rows.length && <div className="text-sm text-white/60">No blog posts yet.</div>}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Edit post" : "New post"}>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs text-white/60">Title</span><input className={inputCls} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">Slug</span><input className={inputCls} value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="my-first-post" /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-xs text-white/60">Cover image URL</span><input className={inputCls} value={editing.cover_url ?? ""} onChange={e => setEditing({ ...editing, cover_url: e.target.value })} placeholder="https://…" /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">Author</span><input className={inputCls} value={editing.author} onChange={e => setEditing({ ...editing, author: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">Tags (comma-sep)</span><input className={inputCls} value={editing.tags.join(", ")} onChange={e => setEditing({ ...editing, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-xs text-white/60">Excerpt</span><input className={inputCls} value={editing.excerpt ?? ""} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">SEO title</span><input className={inputCls} value={editing.seo_title ?? ""} onChange={e => setEditing({ ...editing, seo_title: e.target.value })} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/60">SEO description</span><input className={inputCls} value={editing.seo_description ?? ""} onChange={e => setEditing({ ...editing, seo_description: e.target.value })} /></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /><span className="text-sm text-pearl">Published</span></label>
            </div>
            <div>
              <span className="mb-1 block text-xs text-white/60">Body</span>
              <MarkdownEditor value={editing.body_md} onChange={v => setEditing({ ...editing, body_md: v })} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
              <button onClick={submit} disabled={saving} className={btnPrimary}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============= Modal =============
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl glass gold-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg text-pearl">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-white/15 p-1.5 text-white/70 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
