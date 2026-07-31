-- 1) Employees (admin-managed)
CREATE TABLE public.employees (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  note text,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_own" ON public.employees
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "employees_select_admin" ON public.employees
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER employees_touch BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Work sessions
CREATE TABLE public.work_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  device text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX work_sessions_user_live_idx
  ON public.work_sessions (user_id, last_seen_at DESC)
  WHERE revoked_at IS NULL;

GRANT SELECT ON public.work_sessions TO authenticated;
GRANT ALL ON public.work_sessions TO service_role;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_sessions_select_own" ON public.work_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "work_sessions_select_admin" ON public.work_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER work_sessions_touch BEFORE UPDATE ON public.work_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Audit log
CREATE TABLE public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX security_audit_log_created_idx ON public.security_audit_log (created_at DESC);

GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT ALL ON public.security_audit_log TO service_role;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_admin" ON public.security_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4) Server-side access checks
CREATE OR REPLACE FUNCTION public.has_active_work_session(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid()
         AND NOT public.has_role(auth.uid(), 'admin') THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.work_sessions
       WHERE user_id = _user_id
         AND revoked_at IS NULL
         AND expires_at > now()
         AND last_seen_at > now() - interval '15 minutes'
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.is_employee(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid()
         AND NOT public.has_role(auth.uid(), 'admin') THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.employees WHERE user_id = _user_id AND is_active = true
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.has_employee_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_employee(_user_id) AND public.has_active_work_session(_user_id)
$$;

-- 5) Employee access counts as premium, but only with a live session
CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE
      public.has_role(_user_id, 'admin')
      OR public.has_employee_access(_user_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_comped = true)
      OR EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = _user_id
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at > now())
      )
  END
$$;

REVOKE ALL ON FUNCTION public.has_active_work_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_employee(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_employee_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_work_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_employee(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_employee_access(uuid) TO authenticated;