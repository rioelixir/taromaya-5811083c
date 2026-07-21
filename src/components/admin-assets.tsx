import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/page-shell";
import { Loader2, Upload, Trash2, Image as ImageIcon, Check } from "lucide-react";
import { compressImage, PRESETS } from "@/lib/image-compress";

const BUCKET = "app-assets";

const DECK_KEYS = [
  { key: "rider-waite",    name: "Rider Waite",    expected: 78 },
] as const;


type DeckCard = { path: string; name: string };
type DeckValue = { name: string; expected: number; cards: DeckCard[] };

async function signedUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function AdminAssetsTab() {
  return (
    <div className="space-y-4">
      <LogoEditor />
      <BackgroundEditor />
      {DECK_KEYS.map((d) => (
        <DeckEditor key={d.key} deckKey={d.key} label={d.name} expected={d.expected} />
      ))}
    </div>
  );
}

function LogoEditor() {
  const [path, setPath] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "app.logo").maybeSingle();
    const p = (data?.value as any)?.path ?? null;
    setPath(p);
    setUrl(await signedUrl(p));
  }, []);
  useEffect(() => { load(); }, [load]);

  const onUpload = async (raw: File) => {
    setErr(null); setUploading(true);
    try {
      const file = await compressImage(raw, PRESETS.logo);
      const ext = file.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "png").toLowerCase();
      const key = `logo/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(key, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      if (path && path !== key) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
      const { error: e2 } = await supabase.from("app_settings").upsert({
        key: "app.logo",
        value: { path: key },
        updated_at: new Date().toISOString(),
      });
      if (e2) throw e2;
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onClear = async () => {
    if (!path) return;
    setUploading(true);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      await supabase.from("app_settings").upsert({
        key: "app.logo",
        value: { path: null },
        updated_at: new Date().toISOString(),
      });
      setPath(null); setUrl(null);
    } finally { setUploading(false); }
  };

  return (
    <GlassCard title="App logo" desc="Shown in the sidebar, sign-in page, and everywhere the brand mark appears. Square PNG/SVG with transparent background recommended.">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-white/10 bg-black/40 grid place-items-center flex-shrink-0">
          {url ? (
            <img src={url} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {path ? "Replace" : "Upload"}
            </button>
            {path && (
              <button onClick={onClear} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          {err && <div className="text-xs text-red-300">{err}</div>}
          {path && <div className="text-[10px] text-muted-foreground font-mono truncate">{path}</div>}
        </div>
      </div>
    </GlassCard>
  );
}

function BackgroundEditor() {
  const [path, setPath] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "app.background").maybeSingle();
    const p = (data?.value as any)?.path ?? null;
    setPath(p);
    setUrl(await signedUrl(p));
  }, []);
  useEffect(() => { load(); }, [load]);

  const onUpload = async (raw: File) => {
    setErr(null); setUploading(true);
    try {
      const file = await compressImage(raw, PRESETS.background);
      const ext = file.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "jpg").toLowerCase();
      const key = `background/bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(key, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      // Delete previous
      if (path && path !== key) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
      const { error: e2 } = await supabase.from("app_settings").upsert({
        key: "app.background",
        value: { path: key },
        updated_at: new Date().toISOString(),
      });
      if (e2) throw e2;
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onClear = async () => {
    if (!path) return;
    setUploading(true);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      await supabase.from("app_settings").upsert({
        key: "app.background",
        value: { path: null },
        updated_at: new Date().toISOString(),
      });
      setPath(null); setUrl(null);
    } finally { setUploading(false); }
  };

  return (
    <GlassCard title="Background image" desc="Applied site-wide behind the star field. Recommended: dark, large, 1920×1080 or larger.">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative h-32 w-56 rounded-xl overflow-hidden border border-white/10 bg-black/40 grid place-items-center flex-shrink-0">
          {url ? (
            <img src={url} alt="Background" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {path ? "Replace" : "Upload"}
            </button>
            {path && (
              <button onClick={onClear} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          {err && <div className="text-xs text-red-300">{err}</div>}
          {path && <div className="text-[10px] text-muted-foreground font-mono truncate">{path}</div>}
        </div>
      </div>
    </GlassCard>
  );
}

function DeckEditor({ deckKey, label, expected }: { deckKey: string; label: string; expected: number }) {
  const settingKey = `decks.${deckKey}`;
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", settingKey).maybeSingle();
    const v = (data?.value as DeckValue | null) ?? { name: label, expected, cards: [] };
    setCards(v.cards ?? []);
    const entries = await Promise.all(
      (v.cards ?? []).map(async (c) => [c.path, (await signedUrl(c.path)) ?? ""] as const),
    );
    setUrls(Object.fromEntries(entries));
  }, [settingKey, label, expected]);
  useEffect(() => { load(); }, [load]);

  const save = async (next: DeckCard[]) => {
    await supabase.from("app_settings").upsert({
      key: settingKey,
      value: { name: label, expected, cards: next } as any,
      updated_at: new Date().toISOString(),
    });
  };

  const onUpload = async (files: FileList) => {
    setErr(null); setBusy(true);
    setProgress({ done: 0, total: files.length });
    try {
      const uploaded: DeckCard[] = [];
      for (let i = 0; i < files.length; i++) {
        const raw = files[i];
        const file = await compressImage(raw, PRESETS.card);
        const ext = file.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "png").toLowerCase();
        const clean = raw.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 40);
        const key = `decks/${deckKey}/${Date.now()}-${i}-${clean}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(key, file, { contentType: file.type });
        if (error) throw error;
        uploaded.push({ path: key, name: clean || `card-${i + 1}` });
        setProgress({ done: i + 1, total: files.length });
      }
      const next = [...cards, ...uploaded];
      await save(next);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false); setProgress(null);
    }
  };

  const removeCard = async (path: string) => {
    if (!confirm("Remove this card image?")) return;
    setBusy(true);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      const next = cards.filter((c) => c.path !== path);
      await save(next);
      await load();
    } finally { setBusy(false); }
  };

  const removeAll = async () => {
    if (!cards.length) return;
    if (!confirm(`Remove ALL ${cards.length} card images for ${label}?`)) return;
    setBusy(true);
    try {
      await supabase.storage.from(BUCKET).remove(cards.map((c) => c.path));
      await save([]);
      await load();
    } finally { setBusy(false); }
  };

  const complete = cards.length >= expected;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="font-display text-lg text-pearl flex items-center gap-2">
            {label}
            {complete && <Check className="h-4 w-4 text-aurora" />}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {cards.length} / {expected} cards uploaded
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { const f = e.target.files; if (f && f.length) onUpload(f); e.target.value = ""; }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload images
          </button>
          {cards.length > 0 && (
            <button onClick={removeAll} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
      </div>

      {progress && (
        <div className="mb-3 text-xs text-muted-foreground">Uploading {progress.done} / {progress.total}…</div>
      )}
      {err && <div className="mb-3 text-xs text-red-300">{err}</div>}

      <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${Math.min(100, (cards.length / expected) * 100)}%` }} />
      </div>

      {cards.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-white/10 rounded-xl">
          No card images yet. Upload {expected} images for the {label} deck.
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {cards.map((c, i) => (
            <div key={c.path} className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-black/40">
              {urls[c.path] ? (
                <img src={urls[c.path]} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 text-[9px] text-pearl bg-black/70 px-1 py-0.5 truncate">{i + 1}</div>
              <button
                onClick={() => removeCard(c.path)}
                className="absolute top-1 right-1 h-5 w-5 grid place-items-center rounded-full bg-black/70 text-red-300 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
