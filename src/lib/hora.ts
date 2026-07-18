/**
 * Hora / Planetary Hours (Vedic + Chaldean).
 * Day is divided into 12 horas from sunrise → sunset, night into 12 from sunset → next sunrise.
 * The FIRST hora of a day is ruled by the weekday-lord; subsequent horas follow Chaldean order.
 */

export type HoraLord = "Sun" | "Venus" | "Mercury" | "Moon" | "Saturn" | "Jupiter" | "Mars";

export const CHALDEAN_ORDER: HoraLord[] = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"];

// Vedic weekday → first-hora lord (Sunday=0)
const WEEKDAY_LORD: HoraLord[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export const HORA_NATURE: Record<HoraLord, {
  nature: "benefic" | "malefic" | "neutral";
  best: string;
  avoid: string;
}> = {
  Sun:     { nature: "malefic", best: "Authority, politics, government work, courage", avoid: "New partnerships, marriage" },
  Moon:    { nature: "benefic", best: "Travel, meetings, romance, negotiations", avoid: "Litigation, surgery" },
  Mars:    { nature: "malefic", best: "Property, disputes, sports, real estate", avoid: "Contracts, harmony" },
  Mercury: { nature: "benefic", best: "Communication, study, business, writing", avoid: "Deep spiritual practice" },
  Jupiter: { nature: "benefic", best: "Education, spiritual work, finance, weddings", avoid: "Aggressive actions" },
  Venus:   { nature: "benefic", best: "Romance, art, jewelry, luxury, marriage", avoid: "Renunciation, austerity" },
  Saturn:  { nature: "malefic", best: "Long-term work, discipline, agriculture, service", avoid: "New ventures, celebrations" },
};

export type HoraSlot = {
  index: number;         // 1..24
  lord: HoraLord;
  from: Date;
  to: Date;
  isDay: boolean;
  nature: "benefic" | "malefic" | "neutral";
};

export function computeHoras(sunrise: Date, sunset: Date, nextSunrise: Date, weekday: number): HoraSlot[] {
  const startLord = WEEKDAY_LORD[weekday % 7];
  const startIdx = CHALDEAN_ORDER.indexOf(startLord);
  const dayMs = sunset.getTime() - sunrise.getTime();
  const nightMs = nextSunrise.getTime() - sunset.getTime();
  const dayUnit = dayMs / 12;
  const nightUnit = nightMs / 12;

  const out: HoraSlot[] = [];
  for (let i = 0; i < 24; i++) {
    const lord = CHALDEAN_ORDER[(startIdx + i) % 7];
    const isDay = i < 12;
    const from = new Date(
      isDay ? sunrise.getTime() + i * dayUnit
            : sunset.getTime() + (i - 12) * nightUnit,
    );
    const to = new Date(
      isDay ? sunrise.getTime() + (i + 1) * dayUnit
            : sunset.getTime() + (i - 11) * nightUnit,
    );
    out.push({
      index: i + 1,
      lord,
      from,
      to,
      isDay,
      nature: HORA_NATURE[lord].nature,
    });
  }
  return out;
}

export function currentHora(horas: HoraSlot[], now: Date = new Date()): HoraSlot | null {
  const t = now.getTime();
  return horas.find(h => t >= h.from.getTime() && t < h.to.getTime()) ?? null;
}
