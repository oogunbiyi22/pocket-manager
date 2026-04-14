-- Migration: user_catalogs table
-- Run this in your Supabase SQL editor or via `supabase db push`
-- This stores each user's full song catalog as a JSONB blob.

CREATE TABLE IF NOT EXISTS public.user_catalogs (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  songs      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_catalogs ENABLE ROW LEVEL SECURITY;

-- Only the owner can read/write their own catalog
CREATE POLICY "user_catalogs_owner" ON public.user_catalogs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant service role full access (used by the API server)
GRANT ALL ON public.user_catalogs TO service_role;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS user_catalogs_user_id_idx ON public.user_catalogs (user_id);
