// Friendly time zone helpers. Users never see raw offsets — the app works
// them out from the chosen place and the date of birth (so old dates and
// daylight-saving dates both come out right).

/** Hours east of UTC for an IANA zone at a given moment (handles DST + history). */
export function offsetHoursFor(timeZone: string, at: Date = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    });
    const part = fmt.formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
    const m = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === "-" ? -1 : 1;
    const h = parseInt(m[2], 10);
    const mi = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (h + mi / 60);
  } catch {
    return 0;
  }
}

/**
 * Offset for a *local wall-clock* birth date-time in a zone.
 * We guess with the UTC instant, then correct once — enough for every real zone.
 */
export function offsetForLocalTime(
  timeZone: string,
  y: number, mo: number, d: number, h: number, mi: number,
): number {
  const guessUtc = Date.UTC(y, mo - 1, d, h, mi);
  const first = offsetHoursFor(timeZone, new Date(guessUtc));
  const corrected = new Date(guessUtc - first * 3600_000);
  return offsetHoursFor(timeZone, corrected);
}

/** "India Time", "New York Time" — never a raw number. */
export function friendlyZoneName(timeZone: string, countryName?: string): string {
  const city = timeZone.split("/").pop()?.replace(/_/g, " ");
  if (countryName && (countryName === "India" || !city)) return `${countryName} Time`;
  return `${city} Time`;
}

/** Is this zone currently on daylight saving (summer) time? */
export function isDaylightSaving(timeZone: string, at: Date = new Date()): boolean {
  const jan = offsetHoursFor(timeZone, new Date(Date.UTC(at.getUTCFullYear(), 0, 1)));
  const jul = offsetHoursFor(timeZone, new Date(Date.UTC(at.getUTCFullYear(), 6, 1)));
  const now = offsetHoursFor(timeZone, at);
  return now === Math.max(jan, jul) && jan !== jul;
}
