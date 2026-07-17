
-- Storage policies for app-assets
CREATE POLICY "app_assets read authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'app-assets');

CREATE POLICY "app_assets admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "app_assets admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "app_assets admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

-- Seed default settings for background + deck configurations
INSERT INTO public.app_settings (key, value) VALUES
  ('app.background', '{"path": null}'::jsonb),
  ('decks.rider-waite',    '{"name":"Rider Waite","expected":78,"cards":[]}'::jsonb),
  ('decks.soulmates',      '{"name":"Soulmates","expected":90,"cards":[]}'::jsonb),
  ('decks.health',         '{"name":"Health","expected":78,"cards":[]}'::jsonb),
  ('decks.lost-and-found', '{"name":"Lost and Found","expected":78,"cards":[]}'::jsonb),
  ('decks.nakshatra',      '{"name":"Nakshatra","expected":27,"cards":[]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
