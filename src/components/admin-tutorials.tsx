// Admin CMS for tutorials. Reuses the plain-form pattern already used by
// other admin CMS tabs.

import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/page-shell";
import { listTutorials, upsertTutorial, deleteTutorial, type Tutorial } from "@/lib/tutorials.functions";
import { Plus, Save, Trash2, Loader2, PlayCircle } from "lucide-react";

const BLANK = {
  slug: "welcome",
  title: "",
  description: "",
  language: "en" as Tutorial["language"],
  video_url: "",
  captions_url: "",
  poster_url: "",
  duration_seconds: 0,
  sort_order: 0,
  published: true,
};

export function AdminTutorialsTab() {
  const list = useServerFn(listTutorials);
  const save = useServerFn(upsertTutorial);
  const del = useServerFn(deleteTutorial);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-tutorials"], queryFn: () => list() });
  const [form, setForm] = useState<Partial<Tutorial>>(BLANK);
  const [busy, setBusy] = useState(false);

  const reset = () => setForm(BLANK);

  const submit = async () => {
    if (!form.title || !form.slug || !form.video_url) {
      toast.error("Title, slug and video URL are required");
      return;
    }
    setBusy(true);
    try {
      await save({ data: {
        id: form.id,
        slug: form.slug!,
        title: form.title!,
        description: form.description ?? null,
        language: (form.language ?? "en") as Tutorial["language"],
        video_url: form.video_url!,
        captions_url: form.captions_url || null,
        poster_url: form.poster_url || null,
        duration_seconds: form.duration_seconds ?? null,
        sort_order: form.sort_order ?? 0,
        published: form.published ?? true,
      }});
      toast.success("Saved");
      reset();
      await qc.invalidateQueries({ queryKey: ["admin-tutorials"] });
      await qc.invalidateQueries({ queryKey: ["tutorials"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this tutorial?")) return;
    await del({ data: { id } });
    await qc.invalidateQueries({ queryKey: ["admin-tutorials"] });
    await qc.invalidateQueries({ queryKey: ["tutorials"] });
    toast.success("Deleted");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <GlassCard>
        <h3 className="mb-3 font-serif text-lg">{form.id ? "Edit tutorial" : "New tutorial"}</h3>
        <div className="space-y-3">
          <Field label="Title"><input className="input" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Slug (shared across languages)"><input className="input" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input" rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Language">
            <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as Tutorial["language"] })}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="hi-roman">Roman Hindi</option>
            </select>
          </Field>
          <Field label="Video URL (MP4 direct link or YouTube/Vimeo embed URL)">
            <input className="input" placeholder="https://…/tutorial.mp4 or https://www.youtube.com/embed/…" value={form.video_url ?? ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
          </Field>
          <Field label="Captions URL (WebVTT .vtt — optional)"><input className="input" value={form.captions_url ?? ""} onChange={(e) => setForm({ ...form, captions_url: e.target.value })} /></Field>
          <Field label="Poster image URL (optional)"><input className="input" value={form.poster_url ?? ""} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Duration (sec)"><input type="number" className="input" value={form.duration_seconds ?? 0} onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })} /></Field>
            <Field label="Sort order"><input type="number" className="input" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published ?? true} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Published
          </label>
          <div className="flex gap-2">
            <button disabled={busy} onClick={submit} className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/40 px-4 py-2 text-sm hover:bg-primary/30 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            {form.id && <button onClick={reset} className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5"><Plus className="mr-1 inline h-3 w-3" /> New</button>}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-3 font-serif text-lg">Tutorials</h3>
        {q.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <ul className="space-y-2 text-sm">
            {(q.data ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate font-medium text-foreground">{t.title}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">{t.language}</span>
                    {!t.published && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300">draft</span>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{t.video_url}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setForm(t)} className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5">Edit</button>
                  <button onClick={() => remove(t.id)} className="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-300 hover:bg-red-400/10"><Trash2 className="h-3 w-3" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
