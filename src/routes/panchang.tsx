import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/panchang")({
  component: PanchangPage,
  head: () => ({ meta: [{ title: "Panchang — TAROMAYA" }] }),
});

const items = [
  ["Sunrise", "6:12 AM"],
  ["Sunset", "6:48 PM"],
  ["Moonrise", "9:41 PM"],
  ["Moonset", "8:20 AM"],
  ["Tithi", "Shukla Saptami"],
  ["Nakshatra", "Rohini"],
  ["Yoga", "Siddha"],
  ["Karana", "Vanija"],
  ["Paksha", "Shukla"],
  ["Ritu", "Grishma"],
  ["Ayana", "Uttarayana"],
  ["Samvat", "2082"],
];

const muhurats = [
  ["Rahukaal", "10:36 – 12:12"],
  ["Yamaganda", "3:24 – 5:00"],
  ["Gulika", "7:24 – 9:00"],
  ["Abhijit Muhurat", "12:04 – 12:56"],
];

function PanchangPage() {
  return (
    <PageShell
      eyebrow="Panchang"
      title="The five limbs of time"
      subtitle="Today's cosmic almanac — auspicious timings, planetary hours, and Vedic calendar."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard title="Today's Panchang">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {items.map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
                <div className="mt-1 text-sm text-pearl">{v}</div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard title="Muhurats & Hora">
          <div className="space-y-3">
            {muhurats.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-pearl">{k}</span>
                <span className="text-sm gold-text">{v}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
