
CREATE TABLE public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_invites TO authenticated;
GRANT ALL ON public.staff_invites TO service_role;

ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage staff invites"
  ON public.staff_invites
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER staff_invites_touch_updated_at
  BEFORE UPDATE ON public.staff_invites
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX staff_invites_code_idx ON public.staff_invites (code);
