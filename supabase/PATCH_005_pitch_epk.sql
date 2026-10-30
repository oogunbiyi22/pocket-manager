-- ═══════════════════════════════════════════════════════════════════════════════
-- PATCH 005: Pitching Engine persistence + public EPK share
-- Safe to re-run (every statement is IF NOT EXISTS / idempotent).
--
-- 1) user_playlist_pitches already exists (PATCH 002 / MASTER_RUNME Block 3)
--    as the pitch tracking table, but it has nowhere to keep the generated
--    pitch itself or the curator's contact — the Pitching Engine needs all
--    four to restore a session after refresh. Additive columns only; the
--    table, its status CHECK, and its RLS policy are untouched.
--
-- 2) profiles gains the public-EPK fields: a revocable share token plus the
--    bio/contact the artist writes in the EPK builder, so the public share
--    page (/epk/share/[token]) renders what the artist actually wrote.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS curator_name  text;
ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS curator_email text;
ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS pitch_subject text;
ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS pitch_body    text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS epk_share_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS epk_bio         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS epk_contact     text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_epk_share_token
  ON public.profiles (epk_share_token) WHERE epk_share_token IS NOT NULL;
