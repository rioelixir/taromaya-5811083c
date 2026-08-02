import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BirthOneBox, type BirthOneBoxValue, type OneBoxField } from "@/components/birth-one-box";

export type BirthLike = {
  name?: string;
  date: string;
  time: string;
  tz: string;
  lat: string;
  lon: string;
  place?: string;
};

/**
 * The one birth box used on every page.
 * You speak (or type) one line, the words show up live in the same box, and the
 * app works out the date, the time and the place on its own. The old row of
 * small boxes is tucked away behind "Change by hand" for anyone who wants it.
 */
export function BirthVoiceBox({
  value,
  onChange,
  children,
  title,
  subtitle,
  example,
  need,
}: {
  value: BirthOneBoxValue;
  onChange: (patch: BirthOneBoxValue) => void;
  /** The old fields, kept hidden as a fallback. */
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  example?: string;
  need?: OneBoxField[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <BirthOneBox value={value} onChange={onChange} title={title} subtitle={subtitle} example={example} need={need} />

      {children ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm text-pearl/90 hover:bg-white/10"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {open ? "Hide the small boxes" : "Change by hand"}
          </button>
          {open ? <div className="space-y-3 pt-1">{children}</div> : null}
        </>
      ) : null}
    </div>
  );
}
