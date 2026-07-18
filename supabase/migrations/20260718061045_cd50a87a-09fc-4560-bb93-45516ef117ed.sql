-- Additive columns on saved_kundlis (safe defaults preserve every existing row)
ALTER TABLE public.saved_kundlis
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unspecified',
  ADD COLUMN IF NOT EXISTS zodiac text NOT NULL DEFAULT 'sidereal',
  ADD COLUMN IF NOT EXISTS chart_style text NOT NULL DEFAULT 'north',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

ALTER TABLE public.saved_kundlis
  ADD CONSTRAINT saved_kundlis_gender_chk
    CHECK (gender IN ('unspecified','male','female','neutral','other'));
ALTER TABLE public.saved_kundlis
  ADD CONSTRAINT saved_kundlis_zodiac_chk
    CHECK (zodiac IN ('sidereal','tropical'));
ALTER TABLE public.saved_kundlis
  ADD CONSTRAINT saved_kundlis_style_chk
    CHECK (chart_style IN ('north','south','east'));
ALTER TABLE public.saved_kundlis
  ADD CONSTRAINT saved_kundlis_language_chk
    CHECK (language IN ('en','hi','hi_roman'));

CREATE INDEX IF NOT EXISTS accuracy_reference_charts_category_idx
  ON public.accuracy_reference_charts (category);
