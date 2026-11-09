CREATE TABLE public.user_blocks (
  user_id uuid PRIMARY KEY,
  reason text,
  blocked_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocks" ON public.user_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND blocked_by = auth.uid());
CREATE POLICY "Users see own block" ON public.user_blocks FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_blocked(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_blocks WHERE user_id = _user_id)
$$;

CREATE TABLE public.project_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('Spam','Fake project','Inappropriate content','Duplicate project','Other')),
  details text CHECK (char_length(details) <= 1000),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Dismissed','Resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, reporter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_reports TO authenticated;
GRANT ALL ON public.project_reports TO service_role;
ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students report projects" ON public.project_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND status = 'Open');
CREATE POLICY "Reporters view own reports" ON public.project_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Admins view reports" ON public.project_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reports" ON public.project_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reports" ON public.project_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all skills" ON public.student_skills FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all applications" ON public.project_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove projects" ON public.projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Blocked users cannot create projects" ON public.projects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_blocked(auth.uid()));
CREATE POLICY "Blocked users cannot apply" ON public.project_applications AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_blocked(auth.uid()));
CREATE POLICY "Blocked users cannot report" ON public.project_reports AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_blocked(auth.uid()));