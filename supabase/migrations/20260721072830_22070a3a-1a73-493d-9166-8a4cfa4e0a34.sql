
-- Restrict authenticated reads on app_settings to safe/public keys only; admins can still read all via admin policy
DROP POLICY IF EXISTS "authenticated read app_settings" ON public.app_settings;
CREATE POLICY "authenticated read safe app_settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (
    key = ANY (ARRAY['app.logo'::text, 'app.background'::text])
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Revoke public execute on SECURITY DEFINER trigger function; only triggers (definer) need to run it
REVOKE ALL ON FUNCTION public.auto_comp_taromaya_staff() FROM PUBLIC, anon, authenticated;
