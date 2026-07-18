
CREATE TABLE public.user_birth_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  gender text,
  birth_date date NOT NULL,
  birth_time time NOT NULL,
  tz_offset_hours numeric NOT NULL,
  place text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_birth_profile TO authenticated;
GRANT ALL ON public.user_birth_profile TO service_role;

ALTER TABLE public.user_birth_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own birth profile"
  ON public.user_birth_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own birth profile"
  ON public.user_birth_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own birth profile"
  ON public.user_birth_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own birth profile"
  ON public.user_birth_profile FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_birth_profile_touch
  BEFORE UPDATE ON public.user_birth_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
