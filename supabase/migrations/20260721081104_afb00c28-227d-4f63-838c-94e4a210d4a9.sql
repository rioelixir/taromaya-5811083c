-- Fix: authenticated users should not read every private app-asset.
-- Narrow authenticated SELECT to (a) branding assets referenced by app_settings and (b) admins.
DROP POLICY IF EXISTS "app_assets read authenticated" ON storage.objects;

CREATE POLICY "app_assets read authenticated branding"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-assets'
  AND name IN (
    SELECT (app_settings.value ->> 'path')
    FROM app_settings
    WHERE app_settings.key = ANY (ARRAY['app.logo','app.background'])
      AND app_settings.value ? 'path'
  )
);

CREATE POLICY "app_assets read admin all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-assets'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);