
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_mobile_unique
  ON public.profiles (mobile) WHERE mobile IS NOT NULL;

-- Update signup trigger to capture new metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, mobile)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'mobile', '')
  );
  RETURN NEW;
END;
$$;

-- Login activity table
CREATE TABLE IF NOT EXISTS public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.login_activity TO authenticated;
GRANT ALL ON public.login_activity TO service_role;

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own login activity"
  ON public.login_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own login activity"
  ON public.login_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS login_activity_user_time_idx
  ON public.login_activity (user_id, created_at DESC);
