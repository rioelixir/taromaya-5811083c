import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchSchema = z.object({
  query: z.string().min(1).max(80),
  country: z.string().max(2).optional().default(""),
});

export type PlaceHit = {
  id: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
};

type GeoRow = {
  id: number;
  name: string;
  admin1?: string;
  admin2?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  elevation?: number;
};

/** Look up real towns and cities anywhere in the world. */
export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SearchSchema.parse(d))
  .handler(async ({ data }): Promise<{ places: PlaceHit[] }> => {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", data.query);
    url.searchParams.set("count", "20");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    let rows: GeoRow[] = [];
    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = (await res.json()) as { results?: GeoRow[] };
        rows = json.results ?? [];
      }
    } catch {
      rows = [];
    }

    const wanted = data.country?.toUpperCase();
    const places = rows
      .filter((r) => (wanted ? (r.country_code ?? "").toUpperCase() === wanted : true))
      .map((r) => ({
        id: String(r.id),
        city: r.name,
        state: r.admin1 ?? r.admin2 ?? "",
        country: r.country ?? "",
        countryCode: (r.country_code ?? "").toUpperCase(),
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone ?? "UTC",
        elevation: r.elevation ?? 0,
      }));

    return { places };
  });
