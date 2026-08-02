import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { BirthVoiceBox } from "@/components/birth-voice-box";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { ConfidenceNote } from "@/components/confidence-note";
import { nadiReading } from "@/lib/nadi";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/nadi")({
  component: () => (
    <PremiumGate featureName="Nadi Astrology">
      <NadiPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Nadi Astrology — Nadi Amsa and Leaf Bundle — TAROMAYA" },
      { name: "description", content: "Nadi Jyotisha by calculation: 1800 nadi amsas of 12 arc minutes, Adi Madhya Antya nadi, Chandra Kala part, Bhrigu Bindu timing and leaf bundle identification." },
      { property: "og:title", content: "Nadi Astrology — Nadi Amsa and Leaf Bundle" },
      { property: "og:description", content: "Find your nadi amsa, nadi type, Chandra Kala part and Bhrigu Bindu timing from your birth details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 text-base last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right text-pearl">{v}</span>
    </div>
  );
}

function NadiPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);

  const data = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      return nadiReading({
        year: y!, month: m!, day: d!, hour: hh!, minute: mm!,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Nadi astrology"
      title="Nadi amsa and leaf bundle"
      subtitle="Nadi Jyotisha divides every sign into 150 parts of 12 arc minutes. Your Moon selects one of the 1800 divisions of the zodiac, and that division is the address of your leaf."
    >
      <GlassCard title="Birth details">
        <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
      </GlassCard>

      {data && (
        <div className="mt-6 space-y-6">
          <GlassCard title="Your nadi">
            <Row k="Birth Nakshatra" v={`${data.nakshatra}, pada ${data.pada}`} />
            <Row k="Nadi" v={`${data.nadi} (${data.nadiDosha})`} />
            <Row k="Moon nadi amsa" v={`${data.moonAmsa.inSignIndex} of 150 in ${data.moonAmsa.sign} (division ${data.moonAmsa.zodiacIndex} of 1800)`} />
            <Row k="Ascendant nadi amsa" v={`${data.lagnaAmsa.inSignIndex} of 150 in ${data.lagnaAmsa.sign}`} />
            <Row k="Chandra Kala part" v={`${data.chandraKalaPart} of 150`} />
            <Row k="Leaf bundle" v={data.leafGroup} />
            <p className="mt-3 text-base text-pearl">{data.bodyNote}</p>
            <p className="mt-1 text-base text-pearl">{data.natureNote}</p>
            <p className="mt-3 text-base text-muted-foreground">{data.agreement}</p>
          </GlassCard>

          <GlassCard title="Bhrigu Bindu and timing">
            <Row k="Bhrigu Bindu" v={`${data.bhriguBindu.degreeInSign.toFixed(2)} degrees of ${data.bhriguBindu.sign}`} />
            <Row k="Bhrigu Bindu Nakshatra" v={data.bhriguBindu.nakshatra} />
            <div className="mt-3 space-y-3">
              {data.timing.map((t) => (
                <div key={t.label} className="rounded-xl border border-white/10 p-3">
                  <p className="text-base text-gold">{t.label}</p>
                  <p className="text-base text-pearl">{t.note}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="How this is calculated">
            <ul className="space-y-2 text-base text-pearl">
              {data.method.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </GlassCard>
        </div>
      )}

      <ConfidenceNote noteKey="nadi" className="mt-6" />
    </PageShell>
  );
}
