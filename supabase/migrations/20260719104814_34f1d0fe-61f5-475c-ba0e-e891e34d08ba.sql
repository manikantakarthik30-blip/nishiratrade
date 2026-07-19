
-- 1. Update column defaults
ALTER TABLE public.profiles ALTER COLUMN balance_inr SET DEFAULT 1000000;
ALTER TABLE public.profiles ALTER COLUMN balance_usd SET DEFAULT 10000;

-- 2. Rewrite signup trigger to explicitly seed balances (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, mobile, balance_inr, balance_usd)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'mobile', ''),
    1000000,
    10000
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Ensure the trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill any zero-balance / null profiles that already exist
UPDATE public.profiles SET balance_inr = 1000000 WHERE balance_inr IS NULL OR balance_inr = 0;
UPDATE public.profiles SET balance_usd = 10000  WHERE balance_usd IS NULL OR balance_usd = 0;

-- 5. Insert a profile row for any auth user who somehow doesn't have one
INSERT INTO public.profiles (id, username, balance_inr, balance_usd)
SELECT u.id, COALESCE(split_part(u.email, '@', 1), 'trader'), 1000000, 10000
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
