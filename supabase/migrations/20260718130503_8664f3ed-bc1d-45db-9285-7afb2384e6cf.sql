
CREATE POLICY "Public read app-assets" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'app-assets');
