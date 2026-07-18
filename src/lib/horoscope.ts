// Horoscope engine: deterministic daily influences, moon phase, tarot card of the day.
import * as A from "astronomy-engine";
import { TAROT_DECK, type TarotCard } from "./tarot-deck";
import { SIGN_NAMES } from "./western";

export type Period = "Daily" | "Weekly" | "Monthly" | "Yearly";

// Sun's tropical longitude → zodiac sign
export function sunSign(date: Date): string {
  const eclip = A.Ecliptic(A.GeoVector(A.Body.Sun, date, false));
  const lon = ((eclip.elon % 360) + 360) % 360;
  return SIGN_NAMES[Math.floor(lon / 30)];
}

export function moonSign(date: Date): string {
  const eclip = A.Ecliptic(A.GeoVector(A.Body.Moon, date, false));
  const lon = ((eclip.elon % 360) + 360) % 360;
  return SIGN_NAMES[Math.floor(lon / 30)];
}

export type MoonPhaseInfo = {
  illumination: number; // 0..1
  phaseAngle: number;   // degrees 0-360
  name: string;
  emoji: string;
  waxing: boolean;
};

export function moonPhaseInfo(date: Date): MoonPhaseInfo {
  const illum = A.Illumination(A.Body.Moon, date);
  const angle = A.MoonPhase(date); // 0..360
  const waxing = angle < 180;
  const names: [number, string, string][] = [
    [22.5, "New Moon", "🌑"],
    [67.5, "Waxing Crescent", "🌒"],
    [112.5, "First Quarter", "🌓"],
    [157.5, "Waxing Gibbous", "🌔"],
    [202.5, "Full Moon", "🌕"],
    [247.5, "Waning Gibbous", "🌖"],
    [292.5, "Last Quarter", "🌗"],
    [337.5, "Waning Crescent", "🌘"],
  ];
  let name = "New Moon", emoji = "🌑";
  for (const [limit, n, e] of names) {
    if (angle < limit) { name = n; emoji = e; break; }
  }
  if (angle >= 337.5) { name = "New Moon"; emoji = "🌑"; }
  return { illumination: illum.phase_fraction, phaseAngle: angle, name, emoji, waxing };
}

// Deterministic tarot card of the day (date-seeded)
export function tarotCardOfTheDay(date: Date): { card: TarotCard; reversed: boolean } {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const idx = h % TAROT_DECK.length;
  const reversed = ((h >>> 16) & 1) === 1;
  return { card: TAROT_DECK[idx], reversed };
}

// Simple guidance line pool for the card-of-the-day ribbon
export function cardGuidance(card: TarotCard, reversed: boolean): string {
  const kws = reversed ? card.keywordsReversed : card.keywords;
  return `${reversed ? "Reversed — " : ""}${kws.slice(0, 3).join(" · ")}`;
}
