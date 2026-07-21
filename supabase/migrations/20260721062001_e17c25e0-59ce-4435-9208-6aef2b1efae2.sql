
DROP POLICY IF EXISTS "Public can read unexpired shares by token" ON public.shared_reports;
REVOKE SELECT ON public.shared_reports FROM anon;
