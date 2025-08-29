-- Ensure profiles.user_id is unique so it can be referenced by foreign keys
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Backfill profiles for existing auth users that don't have a profile row yet
INSERT INTO public.profiles (user_id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data ->> 'full_name', u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Drop existing FK if it points to the wrong column and recreate to profiles.user_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'news_author_id_fkey'
      AND table_name = 'news'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE public.news DROP CONSTRAINT news_author_id_fkey;
  END IF;
END $$;

ALTER TABLE public.news
ADD CONSTRAINT news_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES public.profiles(user_id)
ON DELETE SET NULL;