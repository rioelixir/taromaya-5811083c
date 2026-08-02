import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Check } from "lucide-react";
import { VedicShell, VCard } from "@/components/vedic/vedic-shell";
import { useUniversalFields } from "@/components/universal-input";
import { DateSelect } from "@/components/date-select";
import { useProfiles } from "@/lib/vedic-num/profiles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vedic-numerology/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Numerology Profiles — TAROMAYA" },
      { name: "description", content: "Save as many numerology profiles as you need: full name, birth name, birth date and mobile number, and switch between them in one tap." },
      { property: "og:title", content: "Numerology Profiles — TAROMAYA" },
      { property: "og:description", content: "Unlimited saved numerology profiles for you and your clients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProfilePage() {
  const { profiles, active, save, remove, select } = useProfiles();
  const [form, setForm] = useState({ name: "", date: "", birthName: "", mobile: "" });

  useEffect(() => {
    if (active) {
      setForm({
        name: active.fullName,
        date: active.birthDate,
        birthName: active.birthName ?? "",
        mobile: active.mobile ?? "",
      });
    }
  }, [active?.id]);

  // The one mic and text box at the top of the page fills these in.
  useUniversalFields({
    need: ["name", "date"],
    value: { name: form.name, date: form.date },
    onChange: (patch) =>
      setForm((f) => ({
        ...f,
        name: patch.name ?? f.name,
        date: patch.date ?? f.date,
      })),
  });

  const canSave = form.name.trim() !== "" && /^\d{4}-\d{2}-\d{2}$/.test(form.date);

  return (
    <VedicShell
      title="Profiles"
      subtitle="Speak or type a name and birth date in the box above, or fill the fields here. Save as many profiles as you like."
    >
      <VCard title="New or edited profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-vnavy-soft">
            Full name in use
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-2 min-h-12 w-full rounded-xl border border-vline bg-vsurface px-4 text-base text-vnavy outline-none focus:border-vgold"
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-vnavy-soft">
            Name given at birth (optional)
            <input
              value={form.birthName}
              onChange={(e) => setForm((f) => ({ ...f, birthName: e.target.value }))}
              className="mt-2 min-h-12 w-full rounded-xl border border-vline bg-vsurface px-4 text-base text-vnavy outline-none focus:border-vgold"
            />
          </label>
          <div className="text-vnavy">
            <DateSelect
              label="Birth date"
              value={form.date}
              onChange={(iso) => setForm((f) => ({ ...f, date: iso }))}
            />
          </div>
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-vnavy-soft">
            Mobile number (optional)
            <input
              value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              className="mt-2 min-h-12 w-full rounded-xl border border-vline bg-vsurface px-4 text-base text-vnavy outline-none focus:border-vgold"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canSave}
            onClick={() =>
              save({
                fullName: form.name.trim(),
                birthDate: form.date,
                birthName: form.birthName.trim() || undefined,
                mobile: form.mobile.trim() || undefined,
              })
            }
            className="min-h-12 rounded-full bg-vnavy px-6 text-sm font-medium text-vsurface disabled:opacity-40"
          >
            Save as a new profile
          </button>
          {active ? (
            <button
              type="button"
              disabled={!canSave}
              onClick={() =>
                save({
                  id: active.id,
                  fullName: form.name.trim(),
                  birthDate: form.date,
                  birthName: form.birthName.trim() || undefined,
                  mobile: form.mobile.trim() || undefined,
                })
              }
              className="min-h-12 rounded-full border border-vline bg-vsurface px-6 text-sm font-medium text-vnavy disabled:opacity-40"
            >
              Update this profile
            </button>
          ) : null}
        </div>
      </VCard>

      <VCard title="Saved profiles" hint="Tap a profile to make it the one every calculator reads.">
        {profiles.length === 0 ? (
          <p className="text-sm text-vnavy-soft">Nothing saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {profiles.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-4",
                  active?.id === p.id ? "border-vgold/60 bg-vgold/10" : "border-vline bg-vmist",
                )}
              >
                <button type="button" onClick={() => select(p.id)} className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-vnavy">{p.fullName}</p>
                  <p className="text-xs text-vnavy-soft">{p.birthDate}</p>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  {active?.id === p.id ? <Check className="h-4 w-4 text-vgold-deep" /> : null}
                  <button
                    type="button"
                    aria-label={`Delete ${p.fullName}`}
                    onClick={() => remove(p.id)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-vline text-vnavy-soft hover:text-vnavy"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </VCard>
    </VedicShell>
  );
}
