import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Branding = {
  name: string;
  tagline: string;
  heroTitle: string;
  heroKicker: string;
  heroDescription: string;
  footerLine1: string;
  footerLine2: string;
  footerLine3: string;
  theme: {
    background?: string;
    primary?: string;
    gold?: string;
    galaxy?: string;
    accent?: string;
  };
};

export const DEFAULT_BRANDING: Branding = {
  name: "TAROMAYA",
  tagline: "Cosmic Oracle · Vedic Wisdom · AI Guidance",
  heroTitle: "TAROMAYA",
  heroKicker: "Cosmic Oracle · Vedic Wisdom · AI Guidance",
  heroDescription:
    "Enter the cosmic portal — tarot, Vedic astrology, kundli, panchang, numerology and an AI oracle in one luxury platform.",
  footerLine1: "2026 • Taromaya.",
  footerLine2: "App created by Riaa.",
  footerLine3: "Reference from theplanetstoday.com",
  theme: {},
};

const BRAND_KEYS = [
  "brand.name",
  "brand.tagline",
  "brand.hero.title",
  "brand.hero.kicker",
  "brand.hero.description",
  "brand.footer.line1",
  "brand.footer.line2",
  "brand.footer.line3",
  "theme.background",
  "theme.primary",
  "theme.gold",
  "theme.galaxy",
  "theme.accent",
];

function readVal(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in (v as any)) {
    const inner = (v as any).value;
    if (typeof inner === "string") return inner;
  }
  return undefined;
}

/** Applies brand + theme settings globally. Returns hydrated branding. */
export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", BRAND_KEYS);
      if (!mounted || !data) return;
      const map = new Map<string, string | undefined>();
      for (const row of data) map.set(row.key, readVal(row.value));

      const next: Branding = {
        name: map.get("brand.name") || DEFAULT_BRANDING.name,
        tagline: map.get("brand.tagline") || DEFAULT_BRANDING.tagline,
        heroTitle: map.get("brand.hero.title") || DEFAULT_BRANDING.heroTitle,
        heroKicker: map.get("brand.hero.kicker") || DEFAULT_BRANDING.heroKicker,
        heroDescription: map.get("brand.hero.description") || DEFAULT_BRANDING.heroDescription,
        footerLine1: map.get("brand.footer.line1") || DEFAULT_BRANDING.footerLine1,
        footerLine2: map.get("brand.footer.line2") || DEFAULT_BRANDING.footerLine2,
        footerLine3: map.get("brand.footer.line3") || DEFAULT_BRANDING.footerLine3,
        theme: {
          background: map.get("theme.background"),
          primary: map.get("theme.primary"),
          gold: map.get("theme.gold"),
          galaxy: map.get("theme.galaxy"),
          accent: map.get("theme.accent"),
        },
      };
      setBranding(next);

      // Apply theme overrides to :root
      const root = document.documentElement;
      const apply = (k: string, v?: string) => {
        if (v && v.trim()) root.style.setProperty(k, v.trim());
        else root.style.removeProperty(k);
      };
      apply("--background", next.theme.background);
      apply("--primary", next.theme.primary);
      apply("--gold", next.theme.gold);
      apply("--galaxy", next.theme.galaxy);
      apply("--accent", next.theme.accent);
    }
    load();
    const onUpdate = () => load();
    window.addEventListener("taromaya:branding-updated", onUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("taromaya:branding-updated", onUpdate);
    };
  }, []);

  return branding;
}
