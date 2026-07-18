import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Save, MapPin, Mail } from "lucide-react";
import { getSkyAlertPrefs, upsertSkyAlertPrefs } from "@/lib/sky-alerts.functions";
import { listKundlis } from "@/lib/kundli-storage.functions";
import { supabase } from "@/integrations/supabase/client";

const INGRESS_PLANETS = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const;

export type SkyLocation = {
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  place: string | null;
};

export function SkyAlertPrefs({ onLocationChange }: { onLocationChange?: (loc: SkyLocation) => void }) {
  const load = useServerFn(getSkyAlertPrefs);
  const save = useServerFn(upsertSkyAlertPrefs);
  const listK = useServerFn(listKundlis);

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [kundlis, setKundlis] = useState<Array<{ id: string; name: string; latitude: number; longitude: number; place: string | null; tz_offset: number }>>([]);
  const [userEmail, setUserEmail] = useState<string>("");

  const [form, setForm] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    latitude: null as number | null,
    longitude: null as number | null,
    place: "" as string,
    alert_new_moon: true,
    alert_full_moon: true,
    alert_retrograde: true,
    alert_ingress: true,
    ingress_planets: [...INGRESS_PLANETS] as string[],
    lead_hours: 24,
    channel: "email" as "email" | "none",
    email: "",
    enabled: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [prefs, ks, userRes] = await Promise.all([
        load().catch(() => null),
        listK().catch(() => []),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      setKundlis(ks as never);
      const email = userRes.data.user?.email ?? "";
      setUserEmail(email);
      if (prefs) {
        setForm((f) => ({
          ...f,
          timezone: prefs.timezone || f.timezone,
          latitude: prefs.latitude ?? null,
          longitude: prefs.longitude ?? null,
          place: prefs.place ?? "",
          alert_new_moon: prefs.alert_new_moon,
          alert_full_moon: prefs.alert_full_moon,
          alert_retrograde: prefs.alert_retrograde,
          alert_ingress: prefs.alert_ingress,
          ingress_planets: prefs.ingress_planets ?? f.ingress_planets,
          lead_hours: prefs.lead_hours ?? 24,
          channel: (prefs.channel as never) ?? "email",
          email: prefs.email ?? email,
          enabled: prefs.enabled,
        }));
      } else {
        setForm((f) => ({ ...f, email }));
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [load, listK]);

  useEffect(() => {
    onLocationChange?.({
      timezone: form.timezone,
      latitude: form.latitude,
      longitude: form.longitude,
      place: form.place || null,
    });
  }, [form.timezone, form.latitude, form.longitude, form.place, onLocationChange]);

  const applyKundli = (id: string) => {
    const k = kundlis.find((x) => x.id === id);
    if (!k) return;
    const tz = tzFromOffset(k.tz_offset) || form.timezone;
    setForm((f) => ({ ...f, latitude: k.latitude, longitude: k.longitude, place: k.place || k.name, timezone: tz }));
  };

  const useBrowserLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude, place: "Current location" }));
    });
  };

  const toggleIngressPlanet = (p: string) => {
    setForm((f) => ({
      ...f,
      ingress_planets: f.ingress_planets.includes(p)
        ? f.ingress_planets.filter((x) => x !== p)
        : [...f.ingress_planets, p],
    }));
  };

  const onSave = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      await save({
        data: {
          timezone: form.timezone,
          latitude: form.latitude,
          longitude: form.longitude,
          place: form.place || null,
          alert_new_moon: form.alert_new_moon,
          alert_full_moon: form.alert_full_moon,
          alert_retrograde: form.alert_retrograde,
          alert_ingress: form.alert_ingress,
          ingress_planets: form.ingress_planets,
          lead_hours: form.lead_hours,
          channel: form.channel,
          email: form.email || null,
          enabled: form.enabled,
        },
      });
      setSavedMsg("Preferences saved ✧");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e) {
      setSavedMsg((e as Error).message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="glass rounded-3xl p-6 text-sm text-muted-foreground">Loading preferences…</div>;
  }

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Bell className="h-3.5 w-3.5 text-gold" /> Sky Alerts & Personalization
        </div>
        <label className="flex items-center gap-2 text-xs text-pearl">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          Alerts enabled
        </label>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-3 w-3 text-gold" /> Your sky
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Timezone</span>
              <input className="input-glass mt-1 w-full" value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="e.g. Asia/Kolkata" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] text-muted-foreground">Latitude</span>
                <input type="number" step="0.0001" className="input-glass mt-1 w-full"
                  value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: e.target.value === "" ? null : Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="text-[11px] text-muted-foreground">Longitude</span>
                <input type="number" step="0.0001" className="input-glass mt-1 w-full"
                  value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: e.target.value === "" ? null : Number(e.target.value) })} />
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Place label</span>
              <input className="input-glass mt-1 w-full" value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="e.g. Mumbai, India" />
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={useBrowserLocation} className="btn-ghost text-xs">Use browser location</button>
              {kundlis.length > 0 && (
                <select onChange={(e) => e.target.value && applyKundli(e.target.value)} defaultValue=""
                  className="input-glass text-xs">
                  <option value="">Use saved Kundli…</option>
                  {kundlis.map((k) => <option key={k.id} value={k.id}>{k.name} — {k.place || "saved"}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Mail className="h-3 w-3 text-gold" /> Delivery
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Channel</span>
              <select className="input-glass mt-1 w-full" value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value as never })}>
                <option value="email">Email</option>
                <option value="none">None (in-app only)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Email</span>
              <input type="email" className="input-glass mt-1 w-full" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={userEmail || "you@example.com"} />
            </label>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Lead time (hours before event)</span>
              <input type="number" min={1} max={168} className="input-glass mt-1 w-full" value={form.lead_hours}
                onChange={(e) => setForm({ ...form, lead_hours: Math.max(1, Math.min(168, Number(e.target.value) || 24)) })} />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Events</div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
          <Toggle label="New Moon" v={form.alert_new_moon} onChange={(v) => setForm({ ...form, alert_new_moon: v })} />
          <Toggle label="Full Moon" v={form.alert_full_moon} onChange={(v) => setForm({ ...form, alert_full_moon: v })} />
          <Toggle label="Retrograde stations" v={form.alert_retrograde} onChange={(v) => setForm({ ...form, alert_retrograde: v })} />
          <Toggle label="Sign ingresses" v={form.alert_ingress} onChange={(v) => setForm({ ...form, alert_ingress: v })} />
        </div>
        {form.alert_ingress && (
          <div className="mt-3">
            <div className="text-[11px] text-muted-foreground">Planets to watch for ingresses</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {INGRESS_PLANETS.map((p) => (
                <button key={p} onClick={() => toggleIngressPlanet(p)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    form.ingress_planets.includes(p)
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">{savedMsg}</div>
        <button onClick={onSave} disabled={saving}
          className="btn-gold inline-flex items-center gap-2 text-sm">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Alerts are sent up to your chosen lead time before each event. Timing is shown in the timezone you set here, so the Live Sky dashboard, moon phase peaks, retrograde windows and ingresses all match your local sky.
      </p>
    </section>
  );
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 cursor-pointer">
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-pearl">{label}</span>
    </label>
  );
}

function tzFromOffset(hours: number): string | null {
  const map: Record<number, string> = {
    [-8]: "America/Los_Angeles", [-7]: "America/Denver", [-6]: "America/Chicago",
    [-5]: "America/New_York", [-4]: "America/Halifax", [-3]: "America/Sao_Paulo",
    [0]: "UTC", [1]: "Europe/Paris", [2]: "Europe/Athens", [3]: "Europe/Moscow",
    [3.5]: "Asia/Tehran", [4]: "Asia/Dubai", [4.5]: "Asia/Kabul",
    [5]: "Asia/Karachi", [5.5]: "Asia/Kolkata", [5.75]: "Asia/Kathmandu",
    [6]: "Asia/Dhaka", [7]: "Asia/Bangkok", [8]: "Asia/Singapore",
    [9]: "Asia/Tokyo", [9.5]: "Australia/Darwin", [10]: "Australia/Sydney",
    [12]: "Pacific/Auckland",
  };
  return map[hours] ?? null;
}
