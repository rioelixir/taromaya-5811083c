import { useEffect, useState } from "react";
import { Loader2, Save, Palette, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/page-shell";
import { adminListSettings, adminUpsertSetting } from "@/lib/admin.functions";

type Field = { key: string; label: string; placeholder?: string; multiline?: boolean; help?: string };

const BRAND_FIELDS: Field[] = [
  { key: "brand.name", label: "App name", placeholder: "TAROMAYA" },
  { key: "brand.tagline", label: "Tagline", placeholder: "Cosmic Oracle · Vedic Wisdom · AI Guidance" },
  { key: "brand.hero.title", label: "Home hero title", placeholder: "TAROMAYA" },
  { key: "brand.hero.kicker", label: "Home hero kicker", placeholder: "Cosmic Oracle · Vedic Wisdom · AI Guidance" },
  { key: "brand.hero.description", label: "Home hero description", multiline: true, placeholder: "Enter the cosmic portal…" },
  { key: "brand.footer.line1", label: "Footer line 1", placeholder: "2026 • Taromaya." },
  { key: "brand.footer.line2", label: "Footer line 2", placeholder: "App created by Riaa." },
  { key: "brand.footer.line3", label: "Footer line 3", placeholder: "Reference by THEPLANETSTODAY.COM" },
];

const THEME_FIELDS: Field[] = [
  { key: "theme.background", label: "Background (oklch)", placeholder: "oklch(0.975 0.015 300)", help: "Any CSS color. Use oklch() for perceptual accuracy." },
  { key: "theme.primary", label: "Primary (oklch)", placeholder: "oklch(0.34 0.17 300)" },
  { key: "theme.gold", label: "Gold accent (oklch)", placeholder: "oklch(0.62 0.14 78)" },
  { key: "theme.galaxy", label: "Galaxy purple (oklch)", placeholder: "oklch(0.66 0.13 300)" },
  { key: "theme.accent", label: "Accent (oklch)", placeholder: "oklch(0.58 0.15 78)" },
];

const PRESETS: Array<{ name: string; theme: Record<string, string> }> = [
  {
    name: "Lavender Pearl (default)",
    theme: {
      "theme.background": "oklch(0.975 0.015 300)",
      "theme.primary": "oklch(0.34 0.17 300)",
      "theme.gold": "oklch(0.62 0.14 78)",
      "theme.galaxy": "oklch(0.66 0.13 300)",
      "theme.accent": "oklch(0.58 0.15 78)",
    },
  },
  {
    name: "Midnight Cosmic",
    theme: {
      "theme.background": "oklch(0.12 0.03 285)",
      "theme.primary": "oklch(0.72 0.17 300)",
      "theme.gold": "oklch(0.82 0.14 85)",
      "theme.galaxy": "oklch(0.55 0.22 295)",
      "theme.accent": "oklch(0.78 0.14 85)",
    },
  },
  {
    name: "Rose Ivory",
    theme: {
      "theme.background": "oklch(0.98 0.015 30)",
      "theme.primary": "oklch(0.42 0.16 20)",
      "theme.gold": "oklch(0.68 0.15 60)",
      "theme.galaxy": "oklch(0.62 0.14 20)",
      "theme.accent": "oklch(0.62 0.16 25)",
    },
  },
  {
    name: "Emerald Occult",
    theme: {
      "theme.background": "oklch(0.14 0.04 165)",
      "theme.primary": "oklch(0.62 0.17 160)",
      "theme.gold": "oklch(0.82 0.13 95)",
      "theme.galaxy": "oklch(0.55 0.14 170)",
      "theme.accent": "oklch(0.78 0.13 95)",
    },
  },
];

export function AdminBrandingTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    adminListSettings()
      .then((rows) => {
        const map: Record<string, string> = {};
        for (const r of rows as Array<{ key: string; value: any }>) {
          if (typeof r.value === "string") map[r.key] = r.value;
          else if (r.value && typeof r.value === "object" && "value" in r.value)
            map[r.key] = String((r.value as any).value ?? "");
        }
        setValues(map);
      })
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const setVal = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  async function save(keys: string[]) {
    setSaving(true);
    setMsg(null);
    try {
      for (const key of keys) {
        const value = values[key] ?? "";
        await adminUpsertSetting({ data: { key, value } });
      }
      window.dispatchEvent(new CustomEvent("taromaya:branding-updated"));
      setMsg("Saved. Refresh other tabs to see updates.");
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const applyPreset = (theme: Record<string, string>) => {
    setValues((prev) => ({ ...prev, ...theme }));
  };

  if (loading) {
    return (
      <GlassCard title="Branding & Theme">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard title="Brand copy" desc="App name, tagline, hero, and footer text.">
        <div className="space-y-4">
          {BRAND_FIELDS.map((f) => (
            <FieldRow key={f.key} field={f} value={values[f.key] || ""} onChange={(v) => setVal(f.key, v)} />
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => save(BRAND_FIELDS.map((f) => f.key))}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold/30 to-galaxy/20 gold-border px-4 py-2 text-sm text-pearl hover:from-gold/40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save brand copy
            </button>
            {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          </div>
        </div>
      </GlassCard>

      <GlassCard title="Theme colors" desc="Set CSS variables live. Any valid CSS color works — oklch() recommended.">
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p.theme)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-pearl hover:bg-white/5"
            >
              <Palette className="h-3.5 w-3.5" /> {p.name}
            </button>
          ))}
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-pearl"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {THEME_FIELDS.map((f) => (
            <FieldRow key={f.key} field={f} value={values[f.key] || ""} onChange={(v) => setVal(f.key, v)} swatch />
          ))}
        </div>
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => save(THEME_FIELDS.map((f) => f.key))}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold/30 to-galaxy/20 gold-border px-4 py-2 text-sm text-pearl hover:from-gold/40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save theme
          </button>
          <span className="text-xs text-muted-foreground">Blank field = revert to default.</span>
        </div>
      </GlassCard>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  swatch,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
  swatch?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{field.label}</span>
        {swatch && value && (
          <span
            className="h-5 w-5 rounded-full border border-white/20"
            style={{ background: value }}
            aria-hidden
          />
        )}
      </div>
      {field.multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
        />
      )}
      {field.help && <p className="mt-1 text-[11px] text-muted-foreground">{field.help}</p>}
    </label>
  );
}
