// Shared input validation helpers used across module forms.
// Every error returns a plain-language, ELI10 message.
import { z } from "zod";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

export const nonEmpty = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Please enter your ${label}.`)
    .max(200, `${label} is too long.`);

export const birthDateSchema = z
  .string()
  .regex(DATE_RE, "Use a valid date in YYYY-MM-DD format.")
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    if (!y || !m || !d) return false;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "That date does not exist on the calendar.")
  .refine((v) => {
    const [y] = v.split("-").map(Number);
    return y >= 1900 && y <= new Date().getUTCFullYear();
  }, "Year must be between 1900 and today.");

export const birthTimeSchema = z
  .string()
  .regex(TIME_RE, "Use 24-hour time like 14:30.")
  .refine((v) => {
    const [hh, mm] = v.split(":").map(Number);
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  }, "Hours must be 0-23 and minutes 0-59.");

export const tzOffsetSchema = z
  .number({ invalid_type_error: "Timezone must be a number." })
  .min(-14, "Timezone offset must be between -14 and +14.")
  .max(14, "Timezone offset must be between -14 and +14.");

export const latitudeSchema = z
  .number({ invalid_type_error: "Latitude must be a number." })
  .min(-90, "Latitude must be between -90 and 90.")
  .max(90, "Latitude must be between -90 and 90.");

export const longitudeSchema = z
  .number({ invalid_type_error: "Longitude must be a number." })
  .min(-180, "Longitude must be between -180 and 180.")
  .max(180, "Longitude must be between -180 and 180.");

export const birthDetailsSchema = z.object({
  full_name: nonEmpty("full name").max(120),
  gender: z.string().max(24).optional().nullable(),
  birth_date: birthDateSchema,
  birth_time: birthTimeSchema,
  tz_offset_hours: tzOffsetSchema,
  place: nonEmpty("birth place"),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export type BirthDetailsInput = z.infer<typeof birthDetailsSchema>;

/** Return a friendly first-error message, or null when valid. */
export function firstError<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): string | null {
  const r = schema.safeParse(value);
  if (r.success) return null;
  return r.error.issues[0]?.message ?? "Please check your input.";
}

/** Collect all issues keyed by field path (for inline form errors). */
export function fieldErrors<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): Record<string, string> {
  const r = schema.safeParse(value);
  if (r.success) return {};
  const out: Record<string, string> = {};
  for (const iss of r.error.issues) {
    const key = iss.path.join(".") || "_";
    if (!out[key]) out[key] = iss.message;
  }
  return out;
}
