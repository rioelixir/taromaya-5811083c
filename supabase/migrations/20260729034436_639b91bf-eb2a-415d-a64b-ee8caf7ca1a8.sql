CREATE POLICY "read deck settings authenticated" ON public.app_settings FOR SELECT TO authenticated USING (key LIKE 'decks.%');
CREATE POLICY "read deck settings anon" ON public.app_settings FOR SELECT TO anon USING (key LIKE 'decks.%');
CREATE POLICY "app_assets read deck art authenticated" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'app-assets' AND name LIKE 'decks/%');
CREATE POLICY "app_assets read deck art anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'app-assets' AND name LIKE 'decks/%');