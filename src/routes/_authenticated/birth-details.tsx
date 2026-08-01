import { PlacePicker } from "@/components/place-picker";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DateSelect } from "@/components/date-select";
import { PremiumGate } from "@/components/premium-gate";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useBirthProfile, useSaveBirthProfile } from "@/hooks/use-birth-profile";
import { useEffect, useState } from "react";
import { Loader2, Save, Lock, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { birthDetailsSchema, fieldErrors } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/birth-details")({
  component: () => (
    <PremiumGate featureName="Birth Details">
      <BirthDetailsPage />
    </PremiumGate>
  ),
});

function BirthDetailsPage() {
  const { data: profile, isLoading } = useBirthProfile();
  const save = useSaveBirthProfile();
  const nav = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    gender: "",
    birth_date: "",
    birth_time: "",
    tz_offset_hours: 5.5,
    place: "",
    latitude: 28.6139,
    longitude: 77.209,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        gender: profile.gender ?? "",
        birth_date: profile.birth_date,
        birth_time: profile.birth_time.slice(0, 5),
        tz_offset_hours: Number(profile.tz_offset_hours),
        place: profile.place,
        latitude: Number(profile.latitude),
        longitude: Number(profile.longitude),
      });
    }
  }, [profile]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: form.full_name.trim(),
      gender: form.gender || null,
      birth_date: form.birth_date,
      birth_time: form.birth_time.length === 5 ? `${form.birth_time}:00` : form.birth_time,
      tz_offset_hours: Number(form.tz_offset_hours),
      place: form.place.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    const errs = fieldErrors(birthDetailsSchema, payload);
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error(Object.values(errs)[0] ?? "Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync(payload);
      toast.success("Birth details saved — private to you.");
      nav({ to: "/deep-jyotish" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <PageShell hideAI
      title="Your Birth Details"
      subtitle="Entered once. Used everywhere. Private to you — even we won't show it to another user."
    >
      <div className="max-w-2xl">
        <GlassCard>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Lock className="h-3.5 w-3.5" />
            End-to-end private. Row-Level Security allows only <b className="mx-1">you</b> to read this row.
          </div>

          {isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading your details…
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Full name (as you'd like it read)" required error={errors.full_name}>
                <input
                  className="input"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  required maxLength={120}
                />
              </Field>

              <Field label="Gender (optional)">
                <select
                  className="input"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">—</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>

              <BirthVoiceBox
                value={{
                  date: form.birth_date,
                  time: form.birth_time,
                  place: form.place,
                  lat: String(form.latitude),
                  lon: String(form.longitude),
                  tz: String(form.tz_offset_hours),
                }}
                onChange={(p) =>
                  setForm((f) => ({
                    ...f,
                    birth_date: p.date ?? f.birth_date,
                    birth_time: p.time ?? f.birth_time,
                    place: p.place ?? f.place,
                    latitude: p.lat !== undefined ? parseFloat(p.lat) || 0 : f.latitude,
                    longitude: p.lon !== undefined ? parseFloat(p.lon) || 0 : f.longitude,
                    tz_offset_hours: p.tz !== undefined ? parseFloat(p.tz) || 0 : f.tz_offset_hours,
                  }))
                }
              />
              {(errors.birth_date || errors.birth_time) && (
                <p className="text-sm text-destructive">
                  {errors.birth_date ?? errors.birth_time}
                </p>
              )}



              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-muted-foreground max-w-md">
                  <b className="text-foreground">ELI10:</b> This is where and when you were born.
                  We use it to calculate your sky map. It stays with your account only.
                </p>
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium px-5 py-2.5 text-sm shadow-lg hover:opacity-95 disabled:opacity-60"
                >
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    profile ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {profile ? "Update details" : "Save & continue"}
                </button>
              </div>
            </form>
          )}
        </GlassCard>

        {profile && (
          <div className="mt-4 flex items-center justify-between glass rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Your details are locked in — every module now reads from here automatically.
            </div>
            <Link to="/deep-jyotish" className="text-primary hover:underline font-medium">
              Open Deep Jyotish →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          background: color-mix(in oklab, var(--card) 92%, transparent);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.9rem;
          color: var(--foreground);
          transition: border 0.15s, box-shadow 0.15s;
        }
        .input:focus { outline: none; border-color: var(--ring); box-shadow: 0 0 0 3px oklch(0.66 0.14 300 / 0.15); }
      `}</style>
    </PageShell>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
        {label}{required && <span className="text-accent"> *</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="block text-[11px] text-red-600 font-medium">
          {error}
        </span>
      )}
    </label>
  );
}
