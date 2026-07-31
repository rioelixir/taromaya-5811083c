import { PlacePicker, type PlaceValue } from "@/components/place-picker";

export type BirthFieldsState = {
  date: string;
  time: string;
  tz: string;
  lat: string;
  lon: string;
  place?: string;
};

/**
 * The one birth-details block used everywhere: date, time, and place.
 * No time-zone numbers, no map numbers, no house-system choices — the app
 * works all of that out on its own.
 */
export function BirthFields<T extends BirthFieldsState>({
  form,
  setForm,
  extra,
}: {
  form: T;
  setForm: (updater: (prev: T) => T) => void;
  extra?: React.ReactNode;
}) {
  const onPlace = (p: PlaceValue) =>
    setForm((f) => ({ ...f, place: p.place, lat: p.lat, lon: p.lon, tz: p.tz }));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <DateSelect
          label="Birth date"
          value={form.date}
          onChange={(iso) => setForm((f) => ({ ...f, date: iso }))}
        />
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          Birth time
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm text-pearl outline-none focus:ring-1 focus:ring-gold/60"
          />
        </label>
      </div>
      <PlacePicker
        value={{ place: form.place ?? "", lat: form.lat, lon: form.lon, tz: form.tz }}
        onChange={onPlace}
        forDate={form.date}
        forTime={form.time}
      />
      {extra}
    </div>
  );
}
