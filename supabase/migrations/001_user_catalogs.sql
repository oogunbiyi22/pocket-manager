-- ─── 1. Profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  artist_name text,
  artist_role text,
  vibe        text,
  plan        text        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  onboarded   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner" ON public.profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
GRANT ALL ON public.profiles TO service_role;

-- ─── 2. User catalogs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_catalogs (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  songs      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_catalogs_owner" ON public.user_catalogs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_catalogs TO service_role;

-- ─── 3. Waitlist ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL UNIQUE,
  artist_name text,
  source      text        NOT NULL DEFAULT 'landing',
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_insert" ON public.waitlist
  FOR INSERT WITH CHECK (true);
GRANT INSERT ON public.waitlist TO anon;
GRANT ALL ON public.waitlist TO service_role;
