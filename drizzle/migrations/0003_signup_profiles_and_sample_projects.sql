-- 1) Create a profile + student role automatically for every new account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, college, course, semester)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'college', ''),
    NULLIF(NEW.raw_user_meta_data->>'course', ''),
    NULLIF(NEW.raw_user_meta_data->>'semester', '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, 'student'::public.app_role
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for accounts created before the trigger existed
INSERT INTO public.profiles (id, full_name, email, college, course, semester)
SELECT u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  u.email,
  NULLIF(u.raw_user_meta_data->>'college', ''),
  NULLIF(u.raw_user_meta_data->>'course', ''),
  NULLIF(u.raw_user_meta_data->>'semester', '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Backfill the student role only for accounts with no role at all (admins untouched)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'student'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id);

-- 2) Mark sample projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;

-- 3) Sample projects for Explore Projects (owned by the admin account so applications can be reviewed)
INSERT INTO public.projects (id, owner_id, title, description, category, team_size, difficulty, duration, status, additional_info, is_sample) VALUES
('a1000000-0000-4000-8000-000000000001', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'CampusPool – Student Ride Sharing',
 'A ride-sharing web app that matches students heading the same way after evening labs and library sessions. Features include college-email sign-up, live ride matching and a safety check-in flow.',
 'Web Development', 5, 'Intermediate', '3–4 months', 'Recruiting', 'Weekly online meet every Saturday. Beginners in UI/UX are welcome.', true),
('a1000000-0000-4000-8000-000000000002', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'NotesNest AI – Smart Study Guides',
 'An AI study companion that turns lecture notes and slides into summaries, flashcards and practice quizzes. The core pipeline is planned; we need people for the web app and model testing.',
 'AI/ML', 4, 'Advanced', 'One semester', 'Recruiting', 'Good for students interested in machine learning and Python.', true),
('a1000000-0000-4000-8000-000000000003', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'GreenHostel – Energy Tracker',
 'IoT sensors plus a dashboard that shows electricity usage for each hostel block, with weekly leaderboards that encourage students to save energy.',
 'IoT', 6, 'Intermediate', '3–4 months', 'Recruiting', 'Hardware kit is provided by the department.', true),
('a1000000-0000-4000-8000-000000000004', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'InternHub – Verified Internship Board',
 'An internship board built by students for students. It collects listings, flags fake postings and lets seniors review the companies where they interned.',
 'Web Development', 4, 'Beginner', '1–2 months', 'Recruiting', 'Great first project for anyone learning HTML, CSS and JavaScript.', true),
('a1000000-0000-4000-8000-000000000005', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'CampusEats – Canteen Pre-order App',
 'An Android app that lets students pre-order food from the campus canteen, skip the queue and get notified when their order is ready.',
 'Mobile Development', 4, 'Intermediate', '1–2 months', 'Recruiting', NULL, true),
('a1000000-0000-4000-8000-000000000006', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'SafeLogin – Phishing Awareness Toolkit',
 'A security awareness toolkit that runs safe phishing simulations for college clubs and teaches students how to spot suspicious emails and links.',
 'Cybersecurity', 3, 'Advanced', '3–4 weeks', 'Recruiting', NULL, true),
('a1000000-0000-4000-8000-000000000007', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'AttendSense – Attendance Insights',
 'A data science project that analyses anonymised attendance data to show trends and help students plan to stay above the minimum attendance requirement.',
 'Data Science', 3, 'Beginner', '3–4 weeks', 'Recruiting', NULL, true),
('a1000000-0000-4000-8000-000000000008', 'd7fbb727-048e-4548-8fcb-ca543a5807f1', 'ClubConnect – College Events Portal',
 'A single place for every college club to post events, manage registrations and share photos. Students get a personal calendar of events they signed up for.',
 'UI/UX', 5, 'Beginner', '1–2 months', 'Recruiting', 'Design-first project: we start with Figma prototypes.', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_skills (project_id, skill_id)
SELECT v.pid::uuid, s.id
FROM (VALUES
  ('a1000000-0000-4000-8000-000000000001', 'React'),
  ('a1000000-0000-4000-8000-000000000001', 'Node.js'),
  ('a1000000-0000-4000-8000-000000000001', 'SQL'),
  ('a1000000-0000-4000-8000-000000000001', 'UI/UX'),
  ('a1000000-0000-4000-8000-000000000002', 'Python'),
  ('a1000000-0000-4000-8000-000000000002', 'Machine Learning'),
  ('a1000000-0000-4000-8000-000000000002', 'React'),
  ('a1000000-0000-4000-8000-000000000003', 'C++'),
  ('a1000000-0000-4000-8000-000000000003', 'JavaScript'),
  ('a1000000-0000-4000-8000-000000000003', 'Data Science'),
  ('a1000000-0000-4000-8000-000000000004', 'HTML'),
  ('a1000000-0000-4000-8000-000000000004', 'CSS'),
  ('a1000000-0000-4000-8000-000000000004', 'JavaScript'),
  ('a1000000-0000-4000-8000-000000000004', 'MySQL'),
  ('a1000000-0000-4000-8000-000000000005', 'Android Development'),
  ('a1000000-0000-4000-8000-000000000005', 'Java'),
  ('a1000000-0000-4000-8000-000000000005', 'Figma'),
  ('a1000000-0000-4000-8000-000000000006', 'Cybersecurity'),
  ('a1000000-0000-4000-8000-000000000006', 'Python'),
  ('a1000000-0000-4000-8000-000000000007', 'Python'),
  ('a1000000-0000-4000-8000-000000000007', 'Data Science'),
  ('a1000000-0000-4000-8000-000000000007', 'SQL'),
  ('a1000000-0000-4000-8000-000000000008', 'Figma'),
  ('a1000000-0000-4000-8000-000000000008', 'UI/UX'),
  ('a1000000-0000-4000-8000-000000000008', 'React')
) AS v(pid, skill)
JOIN public.skills s ON s.name = v.skill
ON CONFLICT DO NOTHING;