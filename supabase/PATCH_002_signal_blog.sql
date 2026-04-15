-- ═══════════════════════════════════════════════════════════════════════════════
-- POCKET MANAGER — PATCH 002
-- Signal playlist pitches + artist blog posts
-- Safe to run multiple times: CREATE IF NOT EXISTS + ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Signal: playlist pitch tracking ─────────────────────────────────────────
-- Mirrors what is stored in pocket-signal-v1 localStorage.
-- Written when a signed-in user sends or updates a pitch.

CREATE TABLE IF NOT EXISTS public.user_playlist_pitches (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_name   text        NOT NULL,
  curator_handle  text,
  platform        text,
  followers       text,
  genre           text,
  mood            text,
  fit_score       integer,
  song_id         text        NOT NULL,
  song_title      text        NOT NULL,
  status          text        NOT NULL DEFAULT 'queued'
                              CHECK (status IN ('queued','sent','opened','replied','placed','declined')),
  sent_date       date,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, song_id, playlist_name)
);

ALTER TABLE public.user_playlist_pitches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlist_pitches_owner" ON public.user_playlist_pitches;
CREATE POLICY "playlist_pitches_owner" ON public.user_playlist_pitches
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_playlist_pitches TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_playlist_pitches_user     ON public.user_playlist_pitches (user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_pitches_status   ON public.user_playlist_pitches (user_id, status);
CREATE INDEX IF NOT EXISTS idx_playlist_pitches_song     ON public.user_playlist_pitches (user_id, song_id);


-- ─── Blog posts ───────────────────────────────────────────────────────────────
-- Artists can publish blog posts / updates linked to their artist profile.
-- slug is unique per user so URLs are /blog/{artist-slug}/{post-slug}

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug         text        NOT NULL,
  title        text        NOT NULL,
  body         text        NOT NULL DEFAULT '',
  excerpt      text,
  cover_url    text,
  song_id      text,
  tags         text[]      NOT NULL DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Owner: full access
DROP POLICY IF EXISTS "blog_posts_owner" ON public.blog_posts;
CREATE POLICY "blog_posts_owner" ON public.blog_posts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public: anyone can read published posts
DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');

GRANT SELECT ON public.blog_posts TO anon;
GRANT ALL    ON public.blog_posts TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_blog_posts_user      ON public.blog_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (status, published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_posts_song      ON public.blog_posts (user_id, song_id)
  WHERE song_id IS NOT NULL;


-- ─── Notifications table ──────────────────────────────────────────────────────
-- Stores in-app notifications: pitch replies, placements, gap alerts.
-- The app reads this on load to show notification badges.

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL
                         CHECK (type IN ('pitch_opened','pitch_placed','pitch_declined','gap_alert','placement','blog_comment','system')),
  title      text        NOT NULL,
  body       text,
  entity_id  text,   -- playlist name, song id, blog post id, etc.
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_owner" ON public.user_notifications;
CREATE POLICY "notifications_owner" ON public.user_notifications
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_notifications TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.user_notifications (user_id, read, created_at DESC)
  WHERE read = false;


-- ─── Helper function: mark notifications read ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.user_notifications
  SET read = true
  WHERE user_id = p_user_id AND read = false;
$$;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid) TO authenticated;
