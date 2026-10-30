-- ═══════════════════════════════════════════════════════════════════════════════
-- PATCH 006: Guild follows + radio submission tracking (Wave 3 honesty pass)
-- Safe to re-run (every statement is IF NOT EXISTS / idempotent).
--
-- 1) guild_follows — the Guild page's follow state used to live in
--    localStorage, so follows vanished on a new device and never existed
--    server-side. One row per (follower, followed) pair.
--
-- 2) user_radio_submissions — the table already existed, but it required a
--    uuid station_id from the seeded radio_stations directory. The radio
--    page also serves a static fallback station list whose ids are not
--    uuids, so those submissions could never be stored. station_id becomes
--    nullable, the station's name is stored alongside it, and the list of
--    songs submitted to a station gets its own column (the page tracks
--    more than one song per station).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Guild follows ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guild_follows (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
CREATE INDEX IF NOT EXISTS idx_guild_follows_follower ON public.guild_follows (follower_id);
ALTER TABLE public.guild_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guild_follows_owner" ON public.guild_follows;
CREATE POLICY "guild_follows_owner" ON public.guild_follows
  USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);
GRANT ALL ON public.guild_follows TO authenticated, service_role;

-- 2) Radio submissions ───────────────────────────────────────────────────────

ALTER TABLE public.user_radio_submissions ALTER COLUMN station_id DROP NOT NULL;
ALTER TABLE public.user_radio_submissions ADD COLUMN IF NOT EXISTS station_name    text;
ALTER TABLE public.user_radio_submissions ADD COLUMN IF NOT EXISTS songs_submitted text[] NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS idx_radio_submissions_user_station_name
  ON public.user_radio_submissions (user_id, station_name) WHERE station_name IS NOT NULL;
