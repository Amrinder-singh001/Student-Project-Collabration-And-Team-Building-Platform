CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 4000),
  category text NOT NULL CHECK (category IN ('Web Development','Mobile Development','AI/ML','Data Science','Cybersecurity','IoT','Software Development','Game Development','UI/UX','Other')),
  team_size integer NOT NULL CHECK (team_size BETWEEN 1 AND 20),
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  duration text NOT NULL CHECK (char_length(duration) BETWEEN 1 AND 60),
  status text NOT NULL DEFAULT 'Recruiting' CHECK (status IN ('Recruiting','Team Formed','In Progress','Completed')),
  image_path text,
  additional_info text CHECK (additional_info IS NULL OR char_length(additional_info) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner_idx ON public.projects(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_skills (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, skill_id)
);
GRANT SELECT, INSERT, DELETE ON public.project_skills TO authenticated;
GRANT ALL ON public.project_skills TO service_role;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view project skills" ON public.project_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners add project skills" ON public.project_skills FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owners remove project skills" ON public.project_skills FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can view project skills" ON public.project_skills FOR SELECT TO anon USING (true);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.project_skills TO anon;
GRANT SELECT ON public.skills TO anon;

CREATE OR REPLACE FUNCTION public.get_project_owners(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, college text, course text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.college, p.course FROM public.profiles p
  WHERE p.id = ANY(_ids) AND EXISTS (SELECT 1 FROM public.projects pr WHERE pr.owner_id = p.id)
$$;
GRANT EXECUTE ON FUNCTION public.get_project_owners(uuid[]) TO anon, authenticated;

CREATE TABLE public.project_bookmarks (
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);
GRANT SELECT, INSERT, DELETE ON public.project_bookmarks TO authenticated;
GRANT ALL ON public.project_bookmarks TO service_role;
ALTER TABLE public.project_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookmarks" ON public.project_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own bookmarks" ON public.project_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own bookmarks" ON public.project_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.project_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  motivation text NOT NULL,
  relevant_skills text NOT NULL,
  contribution text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Accepted','Rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, applicant_id),
  CHECK (char_length(motivation) BETWEEN 10 AND 2000),
  CHECK (char_length(relevant_skills) BETWEEN 2 AND 500),
  CHECK (char_length(contribution) BETWEEN 10 AND 2000)
);
GRANT SELECT, INSERT ON public.project_applications TO authenticated;
GRANT ALL ON public.project_applications TO service_role;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.project_members (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'Other' CHECK (role IN ('Frontend Developer','Backend Developer','Database Developer','UI/UX Designer','Tester','Researcher','Other')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
GRANT SELECT ON public.project_members TO anon, authenticated;
GRANT UPDATE (role), DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND owner_id = _user_id)
$$;

CREATE POLICY "Applicants view own applications" ON public.project_applications FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id OR public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "Students apply for themselves" ON public.project_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id AND status = 'Pending');

CREATE POLICY "Anyone can view team members" ON public.project_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners update member roles" ON public.project_members FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id, auth.uid())) WITH CHECK (public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "Owners remove members" ON public.project_members FOR DELETE TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; cnt int;
BEGIN
  SELECT * INTO p FROM public.projects WHERE id = NEW.project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
  IF p.owner_id = NEW.applicant_id THEN RAISE EXCEPTION 'You cannot apply to your own project'; END IF;
  SELECT count(*) INTO cnt FROM public.project_members WHERE project_id = NEW.project_id;
  IF cnt + 1 >= p.team_size THEN RAISE EXCEPTION 'This team is already full'; END IF;
  IF EXISTS (SELECT 1 FROM public.project_members WHERE project_id = NEW.project_id AND user_id = NEW.applicant_id) THEN
    RAISE EXCEPTION 'You are already on this team'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_application BEFORE INSERT ON public.project_applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_application();

CREATE OR REPLACE FUNCTION public.decide_application(_application_id uuid, _accept boolean, _role text DEFAULT 'Other')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; p record; cnt int;
BEGIN
  SELECT * INTO a FROM public.project_applications WHERE id = _application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  SELECT * INTO p FROM public.projects WHERE id = a.project_id FOR UPDATE;
  IF p.owner_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the project owner can do this'; END IF;
  IF a.status <> 'Pending' THEN RAISE EXCEPTION 'This application was already decided'; END IF;
  IF _accept THEN
    SELECT count(*) INTO cnt FROM public.project_members WHERE project_id = a.project_id;
    IF cnt + 1 >= p.team_size THEN RAISE EXCEPTION 'The team is already full'; END IF;
    INSERT INTO public.project_members(project_id, user_id, role) VALUES (a.project_id, a.applicant_id, _role);
    UPDATE public.project_applications SET status = 'Accepted', updated_at = now() WHERE id = a.id;
  ELSE
    UPDATE public.project_applications SET status = 'Rejected', updated_at = now() WHERE id = a.id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.decide_application(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_application(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_project_applicants(_project_id uuid)
RETURNS TABLE(id uuid, applicant_id uuid, motivation text, relevant_skills text, contribution text, status text, created_at timestamptz,
  full_name text, course text, semester text, college text, bio text, github_url text, portfolio_url text, skills text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.applicant_id, a.motivation, a.relevant_skills, a.contribution, a.status, a.created_at,
    pr.full_name, pr.course, pr.semester, pr.college, pr.bio, pr.github_url, pr.portfolio_url,
    COALESCE((SELECT array_agg(s.name ORDER BY s.name) FROM public.student_skills ss JOIN public.skills s ON s.id = ss.skill_id WHERE ss.user_id = a.applicant_id), '{}')
  FROM public.project_applications a LEFT JOIN public.profiles pr ON pr.id = a.applicant_id
  WHERE a.project_id = _project_id AND public.is_project_owner(_project_id, auth.uid())
  ORDER BY a.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.get_project_applicants(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_project_applicants(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_project_team(_project_id uuid)
RETURNS TABLE(user_id uuid, full_name text, course text, college text, role text, joined_at timestamptz, is_owner boolean, skills text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT x.uid, pr.full_name, pr.course, pr.college, x.role, x.joined, x.is_owner,
    COALESCE((SELECT array_agg(s.name ORDER BY s.name) FROM public.student_skills ss JOIN public.skills s ON s.id = ss.skill_id WHERE ss.user_id = x.uid), '{}')
  FROM (
    SELECT p.owner_id AS uid, 'Project Owner'::text AS role, p.created_at AS joined, true AS is_owner FROM public.projects p WHERE p.id = _project_id
    UNION ALL
    SELECT m.user_id, m.role, m.joined_at, false FROM public.project_members m WHERE m.project_id = _project_id
  ) x LEFT JOIN public.profiles pr ON pr.id = x.uid
  ORDER BY x.is_owner DESC, x.joined
$$;
GRANT EXECUTE ON FUNCTION public.get_project_team(uuid) TO anon, authenticated;

CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  deadline date,
  status text NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do','In Progress','Completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_tasks_project_idx ON public.project_tasks (project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_tasks TO authenticated;
GRANT ALL ON public.project_tasks TO service_role;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = _user_id)
  OR EXISTS (SELECT 1 FROM public.project_members m WHERE m.project_id = _project_id AND m.user_id = _user_id)
$$;

CREATE POLICY "Project team can view tasks" ON public.project_tasks FOR SELECT TO authenticated
USING (is_project_member(project_id, auth.uid()) OR assignee_id = auth.uid());
CREATE POLICY "Owners create tasks" ON public.project_tasks FOR INSERT TO authenticated
WITH CHECK (is_project_owner(project_id, auth.uid()));
CREATE POLICY "Owners and assignees update tasks" ON public.project_tasks FOR UPDATE TO authenticated
USING (is_project_owner(project_id, auth.uid()) OR assignee_id = auth.uid())
WITH CHECK (is_project_owner(project_id, auth.uid()) OR assignee_id = auth.uid());
CREATE POLICY "Owners delete tasks" ON public.project_tasks FOR DELETE TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.enforce_task_update_scope()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_project_owner(NEW.project_id, auth.uid()) THEN
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id
       OR NEW.priority IS DISTINCT FROM OLD.priority
       OR NEW.deadline IS DISTINCT FROM OLD.deadline
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
    THEN
      RAISE EXCEPTION 'Only the project owner can change task details';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_tasks_scope BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.enforce_task_update_scope();
CREATE TRIGGER project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_project_task_stats(_ids uuid[])
RETURNS TABLE(_project_id uuid, _total bigint, _completed bigint, _active bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.project_id, count(*)::bigint,
         count(*) FILTER (WHERE t.status = 'Completed')::bigint,
         count(*) FILTER (WHERE t.status <> 'To Do')::bigint
  FROM public.project_tasks t WHERE t.project_id = ANY(_ids) GROUP BY t.project_id
$$;

CREATE OR REPLACE FUNCTION public.sync_project_workflow(_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur text; idx int; target_idx int; total bigint; comp bigint; active bigint;
BEGIN
  SELECT status INTO cur FROM public.projects WHERE id = _project_id;
  IF cur IS NULL THEN RETURN; END IF;
  idx := CASE cur WHEN 'Recruiting' THEN 0 WHEN 'Team Formed' THEN 1 WHEN 'In Progress' THEN 2 WHEN 'Completed' THEN 3 ELSE 0 END;
  SELECT count(*), count(*) FILTER (WHERE status = 'Completed'), count(*) FILTER (WHERE status <> 'To Do')
    INTO total, comp, active FROM public.project_tasks WHERE project_id = _project_id;
  target_idx := idx;
  IF total > 0 AND comp = total THEN target_idx := 3;
  ELSIF active > 0 THEN target_idx := GREATEST(idx, 2);
  END IF;
  IF target_idx > idx THEN
    UPDATE public.projects
    SET status = CASE target_idx WHEN 1 THEN 'Team Formed' WHEN 2 THEN 'In Progress' ELSE 'Completed' END, updated_at = now()
    WHERE id = _project_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid),
  public.get_project_task_stats(uuid[]), public.sync_project_workflow(uuid) TO authenticated;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('application_received', 'application_accepted', 'application_rejected', 'team_joined', 'task_assigned', 'task_status_updated', 'project_status_changed')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE (read_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark own notifications read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_application_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE project_title text; target_user uuid; kind text; body text;
BEGIN
  SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;
  IF TG_OP = 'INSERT' THEN
    SELECT owner_id INTO target_user FROM public.projects WHERE id = NEW.project_id;
    kind := 'application_received';
    body := 'New application received for "' || COALESCE(project_title, 'your project') || '".';
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Accepted', 'Rejected') THEN
    target_user := NEW.applicant_id;
    kind := CASE WHEN NEW.status = 'Accepted' THEN 'application_accepted' ELSE 'application_rejected' END;
    body := CASE WHEN NEW.status = 'Accepted' THEN 'Your application to "' || COALESCE(project_title, 'a project') || '" was accepted.' ELSE 'Your application to "' || COALESCE(project_title, 'a project') || '" was rejected.' END;
  ELSE
    RETURN NEW;
  END IF;
  IF target_user IS NOT NULL AND target_user IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.notifications (user_id, project_id, event_type, message) VALUES (target_user, NEW.project_id, kind, body);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_application_notifications AFTER INSERT OR UPDATE OF status ON public.project_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_event();

CREATE OR REPLACE FUNCTION public.notify_team_joined()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE project_title text; project_owner uuid; member_name text;
BEGIN
  SELECT p.title, p.owner_id INTO project_title, project_owner FROM public.projects p WHERE p.id = NEW.project_id;
  SELECT full_name INTO member_name FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.user_id IS DISTINCT FROM project_owner THEN
    INSERT INTO public.notifications (user_id, project_id, event_type, message)
    VALUES (NEW.user_id, NEW.project_id, 'team_joined', 'You joined the team for "' || COALESCE(project_title, 'a project') || '".');
  END IF;
  IF project_owner IS NOT NULL AND project_owner IS DISTINCT FROM auth.uid() AND project_owner IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.notifications (user_id, project_id, event_type, message)
    VALUES (project_owner, NEW.project_id, 'team_joined', COALESCE(member_name, 'A student') || ' joined the team for "' || COALESCE(project_title, 'your project') || '".');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_member_join_notifications AFTER INSERT ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.notify_team_joined();

CREATE OR REPLACE FUNCTION public.notify_task_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE project_title text; owner_user uuid; actor uuid := auth.uid(); is_new_assignment boolean := false;
BEGIN
  SELECT p.title, p.owner_id INTO project_title, owner_user FROM public.projects p WHERE p.id = NEW.project_id;
  IF TG_OP = 'INSERT' THEN
    is_new_assignment := NEW.assignee_id IS NOT NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    is_new_assignment := NEW.assignee_id IS NOT NULL AND NEW.assignee_id IS DISTINCT FROM OLD.assignee_id;
  END IF;
  IF is_new_assignment AND NEW.assignee_id IS DISTINCT FROM actor THEN
    INSERT INTO public.notifications (user_id, project_id, event_type, message)
    VALUES (NEW.assignee_id, NEW.project_id, 'task_assigned', 'You were assigned "' || NEW.title || '" in "' || COALESCE(project_title, 'a project') || '".');
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF owner_user IS NOT NULL AND owner_user IS DISTINCT FROM actor THEN
      INSERT INTO public.notifications (user_id, project_id, event_type, message)
      VALUES (owner_user, NEW.project_id, 'task_status_updated', 'Task "' || NEW.title || '" moved to ' || NEW.status || ' in "' || COALESCE(project_title, 'a project') || '".');
    END IF;
    IF NEW.assignee_id IS NOT NULL AND NEW.assignee_id IS DISTINCT FROM actor AND NEW.assignee_id IS DISTINCT FROM owner_user THEN
      INSERT INTO public.notifications (user_id, project_id, event_type, message)
      VALUES (NEW.assignee_id, NEW.project_id, 'task_status_updated', 'Task "' || NEW.title || '" moved to ' || NEW.status || ' in "' || COALESCE(project_title, 'a project') || '".');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_task_notifications AFTER INSERT OR UPDATE OF assignee_id, status ON public.project_tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_task_events();

CREATE OR REPLACE FUNCTION public.notify_project_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    FOR recipient IN
      SELECT NEW.owner_id UNION SELECT m.user_id FROM public.project_members m WHERE m.project_id = NEW.id
    LOOP
      IF recipient IS NOT NULL AND recipient IS DISTINCT FROM auth.uid() THEN
        INSERT INTO public.notifications (user_id, project_id, event_type, message)
        VALUES (recipient, NEW.id, 'project_status_changed', 'Project "' || NEW.title || '" status changed to ' || NEW.status || '.');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_status_notifications AFTER UPDATE OF status ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_project_status_change();