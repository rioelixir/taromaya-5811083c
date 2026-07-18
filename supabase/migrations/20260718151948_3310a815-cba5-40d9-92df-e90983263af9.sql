
-- Restrict app_settings anon reads to known-safe branding keys only
DROP POLICY IF EXISTS "public read app_settings" ON public.app_settings;

CREATE POLICY "anon read safe app_settings"
ON public.app_settings FOR SELECT TO anon
USING (key IN ('app.logo', 'app.background'));

CREATE POLICY "authenticated read app_settings"
ON public.app_settings FOR SELECT TO authenticated
USING (true);

-- Remove blanket public SELECT on app-assets storage bucket
DROP POLICY IF EXISTS "Public read app-assets" ON storage.objects;

-- Allow anon to read only the branding assets (logo / background) referenced by app_settings
CREATE POLICY "anon read app-assets branding"
ON storage.objects FOR SELECT TO anon
USING (
  bucket_id = 'app-assets'
  AND name IN (
    SELECT (value->>'path') FROM public.app_settings
    WHERE key IN ('app.logo', 'app.background') AND value ? 'path'
  )
);
