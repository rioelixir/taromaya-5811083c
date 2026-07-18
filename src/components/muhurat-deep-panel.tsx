import { useMemo, useState } from "react";
import { GlassCard } from "@/components/page-shell";
import { computeMuhuratDeep, CHOGH_META, type ChoghSlot } from "@/lib/muhurat-deep";
import { HORA_NATURE, type HoraSlot } from "@/lib/hora";
import { Sun, Moon, Clock, Sparkles } from "lucide-react";

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

function ChoghGrid({ slots, currentFrom }: { slots: ChoghSlot[]; currentFrom?: number }) {
  const day = slots.filter(s => s.isDay);
  const night = slots.filter(s => !s.isDay);
  return (
    <div className="space-y-4">
      <Section icon={<Sun className="h-3 w-3 text-gold" />} label="Day">
        {day.map((c, i) => (
          <ChoghCell key={i} slot={c} active={c.from.getTime() === currentFrom} />
        ))}
      </Section>
      <Section icon={<Moon className="h-3 w-3 text-gold" />} label="Night">
        {night.map((c, i) => (
          <ChoghCell key={i} slot={c} active={c.from.getTime() === currentFrom} />
        ))}
      </Section>
    </div>
  );
}

function ChoghCell({ slot, active }: { slot: ChoghSlot; active?: boolean }) {
  const meta = CHOGH_META[slot.name];
  return (
    <div className={`rounded-xl border p-3 text-left transition ${natureColor(slot.nature)} ${active ? "ring-1 ring-gold/60 shadow-[0_0_25px_-10px_var(--gold)]" : ""}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-80">
        <span>{slot.name}</span>
        <span>{meta.lord}</span>
      </div>
      <div className="mt-1 font-mono text-sm text-pearl">
        {fmt(slot.from)} – {fmt(slot.to)}
      </div>
      <div className="mt-1 text-[10px] opacity-80 line-clamp-2">{meta.best}</div>
    </div>
  );
}

function HoraGrid({ slots, currentFrom }: { slots: HoraSlot[]; currentFrom?: number }) {
  const day = slots.filter(s => s.isDay);
  const night = slots.filter(s => !s.isDay);
  return (
    <div className="space-y-4">
      <Section icon={<Sun className="h-3 w-3 text-gold" />} label="Day">
        {day.map((h) => <HoraCell key={h.index} slot={h} active={h.from.getTime() === currentFrom} />)}
      </Section>
      <Section icon={<Moon className="h-3 w-3 text-gold" />} label="Night">
        {night.map((h) => <HoraCell key={h.index} slot={h} active={h.from.getTime() === currentFrom} />)}
      </Section>
    </div>
  );
}

function HoraCell({ slot, active }: { slot: HoraSlot; active?: boolean }) {
  const meta = HORA_NATURE[slot.lord];
  return (
    <div className={`rounded-xl border p-3 ${horaColor(slot.nature)} ${active ? "ring-1 ring-gold/60 shadow-[0_0_25px_-10px_var(--gold)]" : ""}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-80">
        <span>{slot.lord}</span>
        <span>#{slot.index}</span>
      </div>
      <div className="mt-1 font-mono text-sm text-pearl">
        {fmt(slot.from)} – {fmt(slot.to)}
      </div>
      <div className="mt-1 text-[10px] opacity-80 line-clamp-2">{meta.best}</div>
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
        {icon} {label} <Clock className="h-3 w-3 opacity-50" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{children}</div>
    </div>
  );
}
