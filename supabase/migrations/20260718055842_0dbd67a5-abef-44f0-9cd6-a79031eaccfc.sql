
CREATE TABLE public.meditation_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  planet text NOT NULL,
  inhale_ms integer NOT NULL DEFAULT 4000,
  hold_in_ms integer NOT NULL DEFAULT 4000,
  exhale_ms integer NOT NULL DEFAULT 6000,
  hold_out_ms integer NOT NULL DEFAULT 2000,
  target_reps integer NOT NULL DEFAULT 108,
  ambient text NOT NULL DEFAULT 'off',
  ambient_volume real NOT NULL DEFAULT 0.4,
  mantra_volume real NOT NULL DEFAULT 0.7,
  guided boolean NOT NULL DEFAULT true,
  loop_mantra boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meditation_presets TO authenticated;
GRANT ALL ON public.meditation_presets TO service_role;

ALTER TABLE public.meditation_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own presets - select" ON public.meditation_presets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own presets - insert" ON public.meditation_presets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own presets - update" ON public.meditation_presets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own presets - delete" ON public.meditation_presets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER meditation_presets_updated
  BEFORE UPDATE ON public.meditation_presets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX meditation_presets_user_idx ON public.meditation_presets(user_id, updated_at DESC);
