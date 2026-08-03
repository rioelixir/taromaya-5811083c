import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProShell, ProCard } from "@/components/astro-pro/pro-shell";
import { DataTable } from "@/components/data-table";
import { PlacePicker, type PlaceValue } from "@/components/place-picker";
import { DateSelect } from "@/components/date-select";
import { AYANAMSAS, AYANAMSA_LABELS, type Ayanamsa } from "@/lib/chart-config";
import {
  useProProfiles, recentPlaces, ACCURACY_LABEL,
  type Accuracy, type ProProfile,
} from "@/lib/astro-pro/profiles";
import { Trash2, Star, Plus } from "lucide-react";

export const Route = createFileRoute("/astro-pro/profiles")({
  head: () => ({
    meta: [
      { title: "Birth Profiles — Taromaya Astrology Pro" },
      {
        name: "description",
        content: "Keep unlimited family and client birth records with exact time, place, time zone, daylight saving and ayanamsa.",
      },
      { property: "og:title", content: "Birth Profiles — Taromaya Astrology Pro" },
      { property: "og:description", content: "Unlimited saved birth records with exact time, place, time zone and ayanamsa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profiles,
});

type Draft = {
  fullName: string;
  gender: ProProfile["gender"];
  birthDate: string;
  birthTime: string;
  place: string;
  lat: string;
  lon: string;
  tz: string;
  dst: boolean;
  ayanamsa: Ayanamsa;
  accuracy: Accuracy;
  relation: string;
};

const EMPTY: Draft = {
  fullName: "",
  gender: "unspecified",
  birthDate: "",
  birthTime: "12:00",
  place: "",
  lat: "",
  lon: "",
  tz: "5.5",
  dst: false,
  ayanamsa: "lahiri",
  accuracy: "approx",
  relation: "",
};

function Profiles() {
  const { profiles, active, save, remove, select } = useProProfiles();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const recents = recentPlaces();

  const onPlace = (p: PlaceValue) =>
    setDraft((d) => ({ ...d, place: p.place, lat: p.lat, lon: p.lon, tz: p.tz }));

  function submit() {
    if (!draft.fullName.trim()) return toast.error("Enter the full name.");
    if (!draft.birthDate) return toast.error("Enter the date of birth.");
    if (!draft.place || !draft.lat || !draft.lon) return toast.error("Choose the birth place.");
    save({
      fullName: draft.fullName.trim(),
      gender: draft.gender,
      birthDate: draft.birthDate,
      birthTime: draft.birthTime || "12:00",
      place: draft.place,
      latitude: Number(draft.lat),
      longitude: Number(draft.lon),
      tzOffsetHours: Number(draft.tz) || 0,
      dst: draft.dst,
      ayanamsa: draft.ayanamsa,
      accuracy: draft.accuracy,
      relation: draft.relation.trim() || undefined,
    });
    toast.success("Profile saved and set as the active chart.");
    setDraft(EMPTY);
  }

  return (
    <ProShell
      title="Birth profiles"
      subtitle="Keep as many family and client records as you need. The selected profile drives every module."
      chartName={active?.fullName ?? null}
    >
      <ProCard title="Saved profiles" hint="Tap a row to make it the active chart.">
        <DataTable
          rows={profiles}
          rowKey={(r) => r.id}
          empty="No profiles yet — add the first birth record below."
          rowClassName={(r) => (r.id === active?.id ? "bg-vgold/10" : "")}
          columns={[
            {
              header: "Name",
              cell: (r) => (
                <button type="button" className="text-left font-medium" onClick={() => select(r.id)}>
                  {r.fullName}
                  {r.relation ? <span className="text-vnavy-soft"> · {r.relation}</span> : null}
                </button>
              ),
            },
            { header: "Born", cell: (r) => `${r.birthDate} ${r.birthTime}` },
            { header: "Place", cell: (r) => r.place },
            { header: "Ayanamsa", cell: (r) => AYANAMSA_LABELS[r.ayanamsa] },
            {
              header: "Actions",
              align: "right",
              cell: (r) => (
                <span className="inline-flex gap-2">
                  <button
                    type="button"
                    aria-label={`Use ${r.fullName}`}
                    onClick={() => select(r.id)}
                    className="rounded-full border border-vline p-2"
                  >
                    <Star className={r.id === active?.id ? "h-3.5 w-3.5 text-vgold-deep" : "h-3.5 w-3.5"} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${r.fullName}`}
                    onClick={() => remove(r.id)}
                    className="rounded-full border border-vline p-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ),
            },
          ]}
        />
      </ProCard>

      <ProCard title="Add a birth record" hint="Exact time and place decide the accuracy of every reading.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium uppercase tracking-wider text-vnavy-soft">
            Full name
            <input
              value={draft.fullName}
              onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
              className="mt-1 min-h-11 w-full rounded-xl border border-vline bg-vsurface px-3 text-sm text-vnavy outline-none focus:border-vgold"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wider text-vnavy-soft">
            Relation or label
            <input
              value={draft.relation}
              placeholder="Self, mother, client"
              onChange={(e) => setDraft((d) => ({ ...d, relation: e.target.value }))}
              className="mt-1 min-h-11 w-full rounded-xl border border-vline bg-vsurface px-3 text-sm text-vnavy outline-none focus:border-vgold"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wider text-vnavy-soft">
            Gender
            <select
              value={draft.gender}
              onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value as ProProfile["gender"] }))}
              className="mt-1 min-h-11 w-full rounded-xl border border-vline bg-vsurface px-3 text-sm text-vnavy outline-none focus:border-vgold"
            >
              <option value="unspecified">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-xs font-medium uppercase tracking-wider text-vnavy-soft">
            Time of birth
            <input
              type="time"
              value={draft.birthTime}
              onChange={(e) => setDraft((d) => ({ ...d, birthTime: e.target.value }))}
              className="mt-1 min-h-11 w-full rounded-xl border border-vline bg-vsurface px-3 text-sm text-vnavy outline-none focus:border-vgold"
            />
          </label>
          <div className="sm:col-span-2">
            <DateSelect
              label="Date of birth"
              value={draft.birthDate}
              onChange={(iso) => setDraft((d) => ({ ...d, birthDate: iso }))}
            />
          </div>
          <div className="sm:col-span-2">
            <PlacePicker
              value={{ place: draft.place, lat: draft.lat, lon: draft.lon, tz: draft.tz }}
              onChange={onPlace}
              forDate={draft.birthDate}
              forTime={draft.birthTime}
            />
            {recents.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {recents.map((p) => (
                  <span key={p} className="rounded-full border border-vline bg-vmist px-3 py-1 text-xs text-vnavy-soft">
                    {p}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <label className="text-xs font-medium uppercase tracking-wider text-vnavy-soft">
            Ayanamsa
            <select
              value={draft.ayanamsa}
              onChange={(e) => setDraft((d) => ({ ...d, ayanamsa: e.target.value as Ayanamsa }))}
              className="mt-1 min-h-11 w-full rounded-xl border border-vline bg-vsurface px-3 text-sm text-vnavy outline-none focus:border-vgold"
            >
              {AYANAMSAS.map((a) => (
                <option key={a} value={a}>
                  {AYANAMSA_LABELS[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium uppercase tracking-wider text-vnavy-soft">
            Birth time accuracy
            <select
              value={draft.accuracy}
              onChange={(e) => setDraft((d) => ({ ...d, accuracy: e.target.value as Accuracy }))}
              className="mt-1 min-h-11 w-full rounded-xl border border-vline bg-vsurface px-3 text-sm text-vnavy outline-none focus:border-vgold"
            >
              <option value="exact">Exact</option>
              <option value="approx">Approximate</option>
              <option value="unknown">Unknown</option>
            </select>
            <span className="mt-1 block text-[11px] normal-case tracking-normal text-vnavy-soft">
              {ACCURACY_LABEL[draft.accuracy]}
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm text-vnavy sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.dst}
              onChange={(e) => setDraft((d) => ({ ...d, dst: e.target.checked }))}
              className="h-4 w-4"
            />
            Daylight saving time was in force at birth
          </label>
        </div>

        <button
          type="button"
          onClick={submit}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-vnavy px-5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Save profile
        </button>
      </ProCard>
    </ProShell>
  );
}
