import { useMemo, useState } from "react";
import { GlassCard } from "@/components/page-shell";
import { computeMuhuratDeep, CHOGH_META, type ChoghSlot } from "@/lib/muhurat-deep";
import { HORA_NATURE, type HoraSlot } from "@/lib/hora";
import { Sun, Moon, Clock, Sparkles } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";

function fmt(d: Date | null) {
  return d ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";
}

function natureColor(n: "Good" | "Neutral" | "Bad") {
  if (n === "Good") return "bg-emerald-500/15 border-emerald-400/40 text-emerald-100";
  if (n === "Neutral") return "bg-amber-500/10 border-amber-400/30 text-amber-100";
  return "bg-red-500/12 border-red-400/40 text-red-200";
}
function horaColor(n: "benefic" | "malefic" | "neutral") {
  if (n === "benefic") return "bg-emerald-500/12 border-emerald-400/30 text-emerald-100";
  if (n === "neutral") return "bg-white/5 border-white/15 text-pearl";
  return "bg-red-500/10 border-red-400/30 text-red-200";
}

export function MuhuratDeepPanel({ date, lat, lon }: { date: string; lat: number; lon: number }) {
  const [tab, setTab] = useState<"chogh" | "hora">("chogh");
  const deep = useMemo(() => computeMuhuratDeep(date, lat, lon), [date, lat, lon]);
  const now = Date.now();
  const currentChogh = deep.choghadiya.find(c => now >= c.from.getTime() && now < c.to.getTime());
  const currentHora = deep.horas.find(h => now >= h.from.getTime() && now < h.to.getTime());

  return (
    <GlassCard
      title="Hora & Choghadiya"
      desc={`${deep.date.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})} · Sunrise ${fmt(deep.sunrise)} · Sunset ${fmt(deep.sunset)}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("chogh")}
          className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border ${tab==="chogh" ? "border-gold/60 bg-gold/10 text-pearl" : "border-white/10 text-muted-foreground hover:border-white/25"}`}
        >Choghadiya</button>
        <button
          onClick={() => setTab("hora")}
          className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border ${tab==="hora" ? "border-gold/60 bg-gold/10 text-pearl" : "border-white/10 text-muted-foreground hover:border-white/25"}`}
        >Hora</button>
        {(currentChogh || currentHora) && (
          <div className="ml-auto text-[10px] uppercase tracking-[0.25em] text-gold/80 inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Now: {tab==="chogh" ? currentChogh?.name : currentHora?.lord}
          </div>
        )}
      </div>

      {tab === "chogh" ? (
        <ChoghGrid slots={deep.choghadiya} currentFrom={currentChogh?.from.getTime()} />
      ) : (
        <HoraGrid slots={deep.horas} currentFrom={currentHora?.from.getTime()} />
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest">
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-emerald-100 text-center">Good</span>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-100 text-center">Neutral</span>
        <span className="rounded-full border border-red-400/40 bg-red-500/10 px-2 py-1 text-red-200 text-center">Bad</span>
      </div>
    </GlassCard>
  );
}

const choghColumns: Column<ChoghSlot>[] = [
  { header: "Name", cell: (s: ChoghSlot) => <span>{s.name}</span> },
  { header: "Lord", cell: (s: ChoghSlot) => <span className="opacity-80">{CHOGH_META[s.name].lord}</span> },
  { header: "Time", cell: (s: ChoghSlot) => <span className="font-mono text-pearl">{fmt(s.from)} – {fmt(s.to)}</span> },
  { header: "Best for", cell: (s: ChoghSlot) => <span className="opacity-80">{CHOGH_META[s.name].best}</span> },
];

function ChoghGrid({ slots, currentFrom }: { slots: ChoghSlot[]; currentFrom?: number }) {
  const day = slots.filter(s => s.isDay);
  const night = slots.filter(s => !s.isDay);
  return (
    <div className="space-y-4 text-xs">
      <Section icon={<Sun className="h-3 w-3 text-gold" />} label="Day">
        <DataTable
          columns={choghColumns}
          rows={day}
          rowKey={(s: ChoghSlot, i: number) => i}
          rowClassName={(s: ChoghSlot) => `${natureColor(s.nature)} ${s.from.getTime() === currentFrom ? "ring-1 ring-gold/60" : ""}`}
        />
      </Section>
      <Section icon={<Moon className="h-3 w-3 text-gold" />} label="Night">
        <DataTable
          columns={choghColumns}
          rows={night}
          rowKey={(s: ChoghSlot, i: number) => i}
          rowClassName={(s: ChoghSlot) => `${natureColor(s.nature)} ${s.from.getTime() === currentFrom ? "ring-1 ring-gold/60" : ""}`}
        />
      </Section>
    </div>
  );
}

const horaColumns: Column<HoraSlot>[] = [
  { header: "Lord", cell: (s: HoraSlot) => <span>{s.lord}</span> },
  { header: "#", cell: (s: HoraSlot) => <span className="opacity-80">{s.index}</span> },
  { header: "Time", cell: (s: HoraSlot) => <span className="font-mono text-pearl">{fmt(s.from)} – {fmt(s.to)}</span> },
  { header: "Best for", cell: (s: HoraSlot) => <span className="opacity-80">{HORA_NATURE[s.lord].best}</span> },
];

function HoraGrid({ slots, currentFrom }: { slots: HoraSlot[]; currentFrom?: number }) {
  const day = slots.filter(s => s.isDay);
  const night = slots.filter(s => !s.isDay);
  return (
    <div className="space-y-4 text-xs">
      <Section icon={<Sun className="h-3 w-3 text-gold" />} label="Day">
        <DataTable
          columns={horaColumns}
          rows={day}
          rowKey={(s: HoraSlot) => s.index}
          rowClassName={(s: HoraSlot) => `${horaColor(s.nature)} ${s.from.getTime() === currentFrom ? "ring-1 ring-gold/60" : ""}`}
        />
      </Section>
      <Section icon={<Moon className="h-3 w-3 text-gold" />} label="Night">
        <DataTable
          columns={horaColumns}
          rows={night}
          rowKey={(s: HoraSlot) => s.index}
          rowClassName={(s: HoraSlot) => `${horaColor(s.nature)} ${s.from.getTime() === currentFrom ? "ring-1 ring-gold/60" : ""}`}
        />
      </Section>
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
        {icon} {label} <Clock className="h-3 w-3 opacity-50" />
      </div>
      <div>{children}</div>
    </div>
  );
}
