ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.skills TO anon, authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are readable by everyone" ON public.skills FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.student_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'Intermediate',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_skills TO authenticated;
GRANT ALL ON public.student_skills TO service_role;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own skills" ON public.student_skills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own skills" ON public.student_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skills" ON public.student_skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own skills" ON public.student_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.skills (name, category) VALUES
  ('Java','Programming'),
  ('C++','Programming'),
  ('Python','Programming'),
  ('HTML','Frontend'),
  ('CSS','Frontend'),
  ('JavaScript','Programming'),
  ('SQL','Database'),
  ('MySQL','Database'),
  ('React','Frontend'),
  ('Node.js','Backend'),
  ('UI/UX','Design'),
  ('Figma','Design'),
  ('Machine Learning','AI/ML'),
  ('Data Science','AI/ML'),
  ('Android Development','Mobile'),
  ('Cybersecurity','Security')
ON CONFLICT (name) DO NOTHING;