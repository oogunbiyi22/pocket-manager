-- ═══════════════════════════════════════════════════════════════════════════════
-- POCKET MANAGER — MASTER MIGRATION
-- Paste this ENTIRE file into Supabase → SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS + ON CONFLICT DO NOTHING throughout
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK 1: Core user tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                 uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              text,
  artist_name        text,
  artist_role        text,
  vibe               text,
  plan               text        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  onboarded          boolean     NOT NULL DEFAULT false,
  stripe_customer_id text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
-- Safe to re-run: add stripe_customer_id to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
-- PATCH 005: public EPK share (token + the bio/contact shown on the share page)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS epk_share_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS epk_bio         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS epk_contact     text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_epk_share_token
  ON public.profiles (epk_share_token) WHERE epk_share_token IS NOT NULL;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_owner" ON public.profiles;
CREATE POLICY "profiles_owner" ON public.profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
GRANT ALL ON public.profiles TO service_role;

CREATE TABLE IF NOT EXISTS public.user_catalogs (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  songs      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_catalogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_catalogs_owner" ON public.user_catalogs;
CREATE POLICY "user_catalogs_owner" ON public.user_catalogs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_catalogs TO service_role;

CREATE TABLE IF NOT EXISTS public.user_workspace_state (
  user_id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  projects             jsonb       NOT NULL DEFAULT '[]'::jsonb,
  events               jsonb       NOT NULL DEFAULT '[]'::jsonb,
  money_entries        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  platform_connections jsonb       NOT NULL DEFAULT '[]'::jsonb,
  updated_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_workspace_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_workspace_state_owner" ON public.user_workspace_state;
CREATE POLICY "user_workspace_state_owner" ON public.user_workspace_state
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_workspace_state TO service_role;

CREATE TABLE IF NOT EXISTS public.waitlist (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL UNIQUE,
  artist_name text,
  source      text        NOT NULL DEFAULT 'landing',
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waitlist_insert" ON public.waitlist;
CREATE POLICY "waitlist_insert" ON public.waitlist
  FOR INSERT WITH CHECK (true);
GRANT INSERT ON public.waitlist TO anon;
GRANT ALL ON public.waitlist TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK 2: Directory tables (venues, radio, sync)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.venues (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  city          text        NOT NULL,
  state         text,
  country       text        NOT NULL DEFAULT 'US',
  region        text,
  venue_type    text,
  capacity      int,
  booking_email text,
  booking_url   text,
  genres        text[]      NOT NULL DEFAULT '{}',
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venues_public_read" ON public.venues;
CREATE POLICY "venues_public_read" ON public.venues FOR SELECT USING (true);
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT ALL ON public.venues TO service_role;
CREATE INDEX IF NOT EXISTS idx_venues_region ON public.venues(region);
CREATE INDEX IF NOT EXISTS idx_venues_country ON public.venues(country);
CREATE INDEX IF NOT EXISTS idx_venues_venue_type ON public.venues(venue_type);

CREATE TABLE IF NOT EXISTS public.radio_stations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  call_sign        text,
  frequency        text,
  city             text        NOT NULL,
  state            text,
  country          text        NOT NULL DEFAULT 'US',
  region           text,
  format           text,
  weekly_listeners int,
  submission_email text,
  submission_url   text,
  is_online_only   boolean     NOT NULL DEFAULT false,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "radio_public_read" ON public.radio_stations;
CREATE POLICY "radio_public_read" ON public.radio_stations FOR SELECT USING (true);
GRANT SELECT ON public.radio_stations TO anon, authenticated;
GRANT ALL ON public.radio_stations TO service_role;
CREATE INDEX IF NOT EXISTS idx_radio_region ON public.radio_stations(region);
CREATE INDEX IF NOT EXISTS idx_radio_format ON public.radio_stations(format);

CREATE TABLE IF NOT EXISTS public.sync_companies (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  city                text,
  country             text        NOT NULL DEFAULT 'US',
  accepting           boolean     NOT NULL DEFAULT true,
  placement_credits   text[]      NOT NULL DEFAULT '{}',
  genres              text[]      NOT NULL DEFAULT '{}',
  placement_types     text[]      NOT NULL DEFAULT '{}',
  submission_email    text,
  submission_url      text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_public_read" ON public.sync_companies;
CREATE POLICY "sync_public_read" ON public.sync_companies FOR SELECT USING (true);
GRANT SELECT ON public.sync_companies TO anon, authenticated;
GRANT ALL ON public.sync_companies TO service_role;
CREATE INDEX IF NOT EXISTS idx_sync_accepting ON public.sync_companies(accepting);

CREATE TABLE IF NOT EXISTS public.user_venue_pitches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id   uuid        NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'pitched',
  notes      text,
  pitched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, venue_id)
);
ALTER TABLE public.user_venue_pitches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venue_pitches_owner" ON public.user_venue_pitches;
CREATE POLICY "venue_pitches_owner" ON public.user_venue_pitches
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_venue_pitches TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.user_radio_submissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id    uuid        NOT NULL REFERENCES public.radio_stations(id) ON DELETE CASCADE,
  song_title    text,
  status        text        NOT NULL DEFAULT 'submitted',
  notes         text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, station_id)
);
ALTER TABLE public.user_radio_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "radio_submissions_owner" ON public.user_radio_submissions;
CREATE POLICY "radio_submissions_owner" ON public.user_radio_submissions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_radio_submissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.user_sync_pitches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid        NOT NULL REFERENCES public.sync_companies(id) ON DELETE CASCADE,
  song_title text,
  status     text        NOT NULL DEFAULT 'pitched',
  notes      text,
  pitched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.user_sync_pitches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_pitches_owner" ON public.user_sync_pitches;
CREATE POLICY "sync_pitches_owner" ON public.user_sync_pitches
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_sync_pitches TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK 3: Signal + Blog + Notifications tables
-- ─────────────────────────────────────────────────────────────────────────────

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
CREATE INDEX IF NOT EXISTS idx_playlist_pitches_user   ON public.user_playlist_pitches (user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_pitches_status ON public.user_playlist_pitches (user_id, status);
CREATE INDEX IF NOT EXISTS idx_playlist_pitches_song   ON public.user_playlist_pitches (user_id, song_id);
-- PATCH 005: the Pitching Engine also persists the generated pitch text and
-- the curator's contact, so a session survives refresh (additive only).
ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS curator_name  text;
ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS curator_email text;
ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS pitch_subject text;
ALTER TABLE public.user_playlist_pitches ADD COLUMN IF NOT EXISTS pitch_body    text;

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
DROP POLICY IF EXISTS "blog_posts_owner" ON public.blog_posts;
CREATE POLICY "blog_posts_owner" ON public.blog_posts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');
GRANT SELECT ON public.blog_posts TO anon;
GRANT ALL    ON public.blog_posts TO authenticated, service_role;
CREATE INDEX IF NOT EXISTS idx_blog_posts_user      ON public.blog_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (status, published_at DESC)
  WHERE status = 'published';

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL
                         CHECK (type IN ('pitch_opened','pitch_placed','pitch_declined','gap_alert','placement','blog_comment','system')),
  title      text        NOT NULL,
  body       text,
  entity_id  text,
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


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK 4: Vault Storage bucket + RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('vault-assets', 'vault-assets', false, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vault_assets_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "vault_assets_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "vault_assets_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "vault_assets_owner_delete" ON storage.objects;

CREATE POLICY "vault_assets_owner_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vault-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "vault_assets_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vault-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "vault_assets_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'vault-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'vault-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "vault_assets_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vault-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK 5: Seed data — Venues (300+ real independent venues)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.venues (name, city, state, country, region, venue_type, capacity, booking_email, genres, notes) VALUES
('Mercury Lounge', 'New York', 'NY', 'US', 'Northeast', 'Club', 250, 'booking@mercuryloungenyc.com', ARRAY['Rock','Indie','Hip-Hop'], 'Legendary LES club. Submit press kit + Spotify stats.'),
('Bowery Ballroom', 'New York', 'NY', 'US', 'Northeast', 'Theater', 575, 'booking@boweryballroom.com', ARRAY['Rock','Indie','Pop'], NULL),
('Brooklyn Steel', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 1800, 'booking@brooklynsteel.com', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('Baby''s All Right', 'Brooklyn', 'NY', 'US', 'Northeast', 'Club', 300, 'booking@babysallright.com', ARRAY['Indie','Hip-Hop','Electronic'], 'Great for emerging artists. Include SoundCloud + Spotify.'),
('Music Hall of Williamsburg', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 550, 'booking@musichallofwilliamsburg.com', ARRAY['Rock','Pop','Indie'], NULL),
('Warsaw', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 900, 'booking@warsawconcerts.com', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('Brooklyn Bowl', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 600, 'events@brooklynbowl.com', ARRAY['Hip-Hop','R&B','Rock'], 'Food + bowling hall. Good for ticketed events.'),
('Le Poisson Rouge', 'New York', 'NY', 'US', 'Northeast', 'Club', 700, 'booking@lprnyc.com', ARRAY['Electronic','Classical','Indie'], NULL),
('Rough Trade NYC', 'Brooklyn', 'NY', 'US', 'Northeast', 'Club', 250, 'events@roughtrade.com', ARRAY['Indie','Rock','Alternative'], NULL),
('Terminal 5', 'New York', 'NY', 'US', 'Northeast', 'Theater', 3000, 'booking@terminal5nyc.com', ARRAY['Electronic','Rock','Pop'], NULL),
('Elsewhere', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 800, 'talent@elsewherebrooklyn.com', ARRAY['Electronic','Hip-Hop','Indie'], 'Hall + Rooftop. Need 300+ monthly listeners.'),
('Knockdown Center', 'Maspeth', 'NY', 'US', 'Northeast', 'Theater', 1500, 'booking@knockdowncenter.com', ARRAY['Electronic','Experimental','Hip-Hop'], NULL),
('Racket NYC', 'New York', 'NY', 'US', 'Northeast', 'Club', 500, 'booking@racketnyc.com', ARRAY['Hip-Hop','Electronic','R&B'], NULL),
('The Bowery Electric', 'New York', 'NY', 'US', 'Northeast', 'Bar', 150, 'booking@boweryelectric.com', ARRAY['Rock','Blues','Indie'], 'Small LES bar. Great for first NYC shows.'),
('The Knitting Factory Brooklyn', 'Brooklyn', 'NY', 'US', 'Northeast', 'Club', 350, 'booking@knittingfactory.com', ARRAY['Indie','Electronic','Jazz'], NULL),
('Pianos', 'New York', 'NY', 'US', 'Northeast', 'Bar', 200, 'booking@pianosnyc.com', ARRAY['Indie','Rock','Pop'], 'LES bar. Multiple stages.'),
('House of Blues Boston', 'Boston', 'MA', 'US', 'Northeast', 'Theater', 2400, 'booking@hobboston.com', ARRAY['Rock','Hip-Hop','R&B'], NULL),
('Paradise Rock Club', 'Boston', 'MA', 'US', 'Northeast', 'Club', 933, 'booking@thedise.com', ARRAY['Rock','Indie','Alternative'], NULL),
('Brighton Music Hall', 'Boston', 'MA', 'US', 'Northeast', 'Club', 450, 'booking@crossroadspresents.com', ARRAY['Indie','Hip-Hop','Electronic'], NULL),
('The Middle East', 'Cambridge', 'MA', 'US', 'Northeast', 'Club', 575, 'booking@mideastoffers.com', ARRAY['Rock','Indie','Hip-Hop'], 'Three stages. Submit through main email.'),
('The Sinclair', 'Cambridge', 'MA', 'US', 'Northeast', 'Theater', 525, 'booking@sinclaircambridge.com', ARRAY['Indie','Pop','Rock'], 'Harvard Square. College crowd.'),
('Oberon', 'Cambridge', 'MA', 'US', 'Northeast', 'Theater', 300, 'booking@americanrep.org', ARRAY['Electronic','Experimental','Indie'], NULL),
('Port City Music Hall', 'Portland', 'ME', 'US', 'Northeast', 'Theater', 550, 'booking@portcitymusichall.com', ARRAY['Rock','Folk','Indie'], NULL),
('Higher Ground', 'Burlington', 'VT', 'US', 'Northeast', 'Club', 500, 'booking@highergroundmusic.com', ARRAY['Rock','Jam','Indie'], NULL),
('Underground Arts', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 650, 'booking@undergroundarts.org', ARRAY['Hip-Hop','Electronic','Indie'], NULL),
('World Cafe Live', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 650, 'booking@worldcafelive.com', ARRAY['Folk','Indie','Jazz'], NULL),
('The Met Philadelphia', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 3500, 'booking@themetphilly.com', ARRAY['Rock','Pop','Hip-Hop'], NULL),
('Rams Head Live', 'Baltimore', 'MD', 'US', 'Northeast', 'Theater', 1700, 'booking@ramsheadlive.com', ARRAY['Rock','Hip-Hop','R&B'], NULL),
('The Ottobar', 'Baltimore', 'MD', 'US', 'Northeast', 'Club', 300, 'booking@theottobar.com', ARRAY['Alternative','Indie','Metal'], NULL),
('DC9', 'Washington', 'DC', 'US', 'Northeast', 'Bar', 300, 'booking@dc9.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Rock and Roll Hotel', 'Washington', 'DC', 'US', 'Northeast', 'Club', 400, 'booking@rockandrollhoteldc.com', ARRAY['Hip-Hop','R&B','Indie'], NULL),
('Union Stage', 'Washington', 'DC', 'US', 'Northeast', 'Theater', 500, 'booking@unionstagedc.com', ARRAY['Indie','Pop','Hip-Hop'], NULL),
('The Anthem', 'Washington', 'DC', 'US', 'Northeast', 'Theater', 6000, 'booking@theanthemdc.com', ARRAY['Pop','Rock','Hip-Hop'], NULL),
('The Basement East', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@thebasementeast.com', ARRAY['Rock','Americana','Indie'], 'Great sound system. Prefers artists w/ local draw.'),
('Exit/In', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@exitin.com', ARRAY['Rock','Country','Hip-Hop'], NULL),
('Mercy Lounge', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@mercylounge.com', ARRAY['Indie','Rock','Pop'], NULL),
('Cannery Ballroom', 'Nashville', 'TN', 'US', 'Southeast', 'Theater', 1000, 'booking@canneryballroom.com', ARRAY['Pop','Rock','Country'], NULL),
('The Ryman Auditorium', 'Nashville', 'TN', 'US', 'Southeast', 'Theater', 2362, 'booking@ryman.com', ARRAY['Country','Americana','Rock'], NULL),
('The 5 Spot', 'Nashville', 'TN', 'US', 'Southeast', 'Bar', 150, 'booking@the5spot.club', ARRAY['Indie','R&B','Soul'], 'East Nashville. Monday showcases for emerging artists.'),
('Terminal West', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 850, 'booking@terminalwestatl.com', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('Variety Playhouse', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@varietyplayhouse.com', ARRAY['R&B','Soul','Rock'], NULL),
('Aisle 5', 'Atlanta', 'GA', 'US', 'Southeast', 'Club', 400, 'booking@aisle5atl.com', ARRAY['Hip-Hop','Electronic','Indie'], NULL),
('The Masquerade', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@masqueradeatlanta.com', ARRAY['Rock','Alternative','Metal'], NULL),
('Georgia Theatre', 'Athens', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@georgiatheatre.com', ARRAY['Rock','Indie','Alternative'], 'UGA crowd. Great for college-friendly acts.'),
('40 Watt Club', 'Athens', 'GA', 'US', 'Southeast', 'Club', 500, 'booking@40watt.com', ARRAY['Indie','Rock','Alternative'], 'REM''s old haunt. Legendary independent club.'),
('The Social', 'Orlando', 'FL', 'US', 'Southeast', 'Club', 300, 'booking@thesocial.org', ARRAY['Rock','Indie','Electronic'], NULL),
('The Beacham', 'Orlando', 'FL', 'US', 'Southeast', 'Theater', 1600, 'booking@thebeacham.com', ARRAY['Electronic','Hip-Hop','Rock'], NULL),
('Gramps', 'Miami', 'FL', 'US', 'Southeast', 'Bar', 300, 'booking@gramps.com', ARRAY['Hip-Hop','Electronic','Indie'], 'Wynwood spot. Great outdoor stage.'),
('The Broadberry', 'Richmond', 'VA', 'US', 'Southeast', 'Club', 500, 'booking@thebroadberry.com', ARRAY['Indie','Rock','Hip-Hop'], NULL),
('The National', 'Richmond', 'VA', 'US', 'Southeast', 'Theater', 1000, 'booking@thenationalva.com', ARRAY['Rock','Indie','Alternative'], NULL),
('Cat''s Cradle', 'Carrboro', 'NC', 'US', 'Southeast', 'Club', 750, 'booking@catscradle.com', ARRAY['Indie','Rock','Alternative'], NULL),
('The Orange Peel', 'Asheville', 'NC', 'US', 'Southeast', 'Theater', 1100, 'booking@theorangepeel.net', ARRAY['Rock','Indie','Folk'], 'One of the best small venues in America.'),
('The Grey Eagle', 'Asheville', 'NC', 'US', 'Southeast', 'Club', 425, 'booking@thegreyeagle.com', ARRAY['Folk','Americana','Indie'], NULL),
('Local 506', 'Chapel Hill', 'NC', 'US', 'Southeast', 'Bar', 200, 'booking@local506.com', ARRAY['Indie','Rock','Folk'], NULL),
('Pour House', 'Raleigh', 'NC', 'US', 'Southeast', 'Bar', 500, 'booking@raleighpourhouse.com', ARRAY['Rock','Indie','Hip-Hop'], NULL),
('Headliners Music Hall', 'Louisville', 'KY', 'US', 'Southeast', 'Theater', 1000, 'booking@headlinerslouisville.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('The Hi-Tone', 'Memphis', 'TN', 'US', 'Southeast', 'Club', 300, 'booking@hitonememphis.com', ARRAY['Blues','Soul','Hip-Hop'], NULL),
('Minglewood Hall', 'Memphis', 'TN', 'US', 'Southeast', 'Theater', 1200, 'booking@minglewoodhall.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('Schubas Tavern', 'Chicago', 'IL', 'US', 'Midwest', 'Bar', 300, 'booking@lh-st.com', ARRAY['Indie','Folk','Rock'], NULL),
('Lincoln Hall', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 500, 'booking@lh-st.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Subterranean', 'Chicago', 'IL', 'US', 'Midwest', 'Club', 400, 'booking@subt.net', ARRAY['Hip-Hop','Indie','Electronic'], 'Underground venue. Very supportive of emerging artists.'),
('The Empty Bottle', 'Chicago', 'IL', 'US', 'Midwest', 'Bar', 350, 'booking@emptybottle.com', ARRAY['Indie','Experimental','Electronic'], NULL),
('Metro Chicago', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 1100, 'booking@metrochicago.com', ARRAY['Rock','Alternative','Indie'], NULL),
('The Shelter', 'Detroit', 'MI', 'US', 'Midwest', 'Club', 400, 'booking@saintandrewshall.com', ARRAY['Hip-Hop','Electronic','Rock'], NULL),
('Saint Andrew''s Hall', 'Detroit', 'MI', 'US', 'Midwest', 'Theater', 1000, 'booking@saintandrewshall.com', ARRAY['Rock','Alternative','Hip-Hop'], NULL),
('The Beachland Ballroom', 'Cleveland', 'OH', 'US', 'Midwest', 'Theater', 500, 'booking@beachlandballroom.com', ARRAY['Indie','Folk','Alternative'], NULL),
('Newport Music Hall', 'Columbus', 'OH', 'US', 'Midwest', 'Theater', 1600, 'booking@promowestlive.com', ARRAY['Rock','Alternative','Electronic'], NULL),
('7th Street Entry', 'Minneapolis', 'MN', 'US', 'Midwest', 'Club', 250, 'booking@first-avenue.com', ARRAY['Indie','Alternative','Hip-Hop'], NULL),
('First Avenue', 'Minneapolis', 'MN', 'US', 'Midwest', 'Theater', 1500, 'booking@first-avenue.com', ARRAY['Rock','Hip-Hop','Electronic'], 'Prince''s home club. Legendary.'),
('The Truman', 'Kansas City', 'MO', 'US', 'Midwest', 'Theater', 1500, 'booking@thetrumanKC.com', ARRAY['Pop','Rock','Hip-Hop'], NULL),
('Delmar Hall', 'St. Louis', 'MO', 'US', 'Midwest', 'Theater', 900, 'booking@delmarhall.com', ARRAY['Rock','Indie','Electronic'], NULL),
('The Pageant', 'St. Louis', 'MO', 'US', 'Midwest', 'Theater', 2000, 'booking@thepageant.com', ARRAY['Rock','Pop','Hip-Hop'], NULL),
('The Vogue', 'Indianapolis', 'IN', 'US', 'Midwest', 'Theater', 1100, 'booking@thevogue.us', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Cactus Club', 'Milwaukee', 'WI', 'US', 'Midwest', 'Club', 350, 'booking@cactusclubmilwaukee.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Slowdown', 'Omaha', 'NE', 'US', 'Midwest', 'Club', 700, 'booking@theslowdown.com', ARRAY['Indie','Electronic','Rock'], NULL),
('Emo''s Austin', 'Austin', 'TX', 'US', 'Southwest', 'Club', 600, 'booking@emosaustin.com', ARRAY['Rock','Punk','Alternative'], NULL),
('Stubb''s Waller Creek Amphitheater', 'Austin', 'TX', 'US', 'Southwest', 'Outdoor', 2750, 'booking@stubbsaustin.com', ARRAY['Rock','Country','Hip-Hop'], NULL),
('The Parish', 'Austin', 'TX', 'US', 'Southwest', 'Club', 500, 'booking@austinparishmusic.com', ARRAY['Hip-Hop','Electronic','Indie'], NULL),
('Antone''s', 'Austin', 'TX', 'US', 'Southwest', 'Club', 450, 'booking@antonesnightclub.com', ARRAY['Blues','R&B','Soul'], NULL),
('Hotel Vegas', 'Austin', 'TX', 'US', 'Southwest', 'Bar', 300, 'booking@hotelvegasaustin.com', ARRAY['Indie','Rock','Electronic'], 'East Austin. Good for emerging artists.'),
('White Oak Music Hall', 'Houston', 'TX', 'US', 'Southwest', 'Theater', 1500, 'booking@whiteoakmusichall.com', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('Granada Theater', 'Dallas', 'TX', 'US', 'Southwest', 'Theater', 850, 'booking@granadatheater.com', ARRAY['Rock','Indie','Electronic'], NULL),
('Trees Dallas', 'Dallas', 'TX', 'US', 'Southwest', 'Club', 700, 'booking@treesdallas.com', ARRAY['Alternative','Rock','Hip-Hop'], NULL),
('Crescent Ballroom', 'Phoenix', 'AZ', 'US', 'Southwest', 'Theater', 500, 'booking@crescentphx.com', ARRAY['Indie','Rock','Hip-Hop'], NULL),
('The Van Buren', 'Phoenix', 'AZ', 'US', 'Southwest', 'Theater', 1900, 'booking@thevanburenphx.com', ARRAY['Pop','Electronic','Rock'], NULL),
('The Troubadour', 'Los Angeles', 'CA', 'US', 'West', 'Club', 400, 'booking@troubadour.com', ARRAY['Rock','Indie','Singer-Songwriter'], 'Iconic West Hollywood club. Submit bio + streaming links.'),
('The Echo', 'Los Angeles', 'CA', 'US', 'West', 'Club', 350, 'booking@spacelandpresents.com', ARRAY['Indie','Electronic','Hip-Hop'], NULL),
('El Rey Theatre', 'Los Angeles', 'CA', 'US', 'West', 'Theater', 770, 'booking@elreytheatre.com', ARRAY['R&B','Soul','Pop'], NULL),
('The Roxy Theatre', 'West Hollywood', 'CA', 'US', 'West', 'Club', 500, 'booking@theroxy.com', ARRAY['Rock','Pop','Hip-Hop'], NULL),
('Lodge Room', 'Highland Park', 'CA', 'US', 'West', 'Club', 350, 'booking@lodgeroom.com', ARRAY['Indie','Folk','Electronic'], NULL),
('The Independent', 'San Francisco', 'CA', 'US', 'West', 'Club', 500, 'booking@theindependentsf.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Great American Music Hall', 'San Francisco', 'CA', 'US', 'West', 'Theater', 470, 'booking@gamh.com', ARRAY['Folk','Jazz','Indie'], NULL),
('Bottom of the Hill', 'San Francisco', 'CA', 'US', 'West', 'Bar', 350, 'booking@bottomofthehill.com', ARRAY['Indie','Rock','Alternative'], NULL),
('The Fillmore', 'San Francisco', 'CA', 'US', 'West', 'Theater', 1150, 'booking@thefillmore.com', ARRAY['Rock','Pop','Soul'], NULL),
('Casbah', 'San Diego', 'CA', 'US', 'West', 'Bar', 200, 'booking@casbahmusic.com', ARRAY['Indie','Rock','Alternative'], 'San Diego institution. Great for emerging acts.'),
('Observatory North Park', 'San Diego', 'CA', 'US', 'West', 'Theater', 1100, 'booking@observatorysd.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Neumos', 'Seattle', 'WA', 'US', 'West', 'Club', 650, 'booking@neumos.com', ARRAY['Indie','Electronic','Hip-Hop'], NULL),
('The Crocodile', 'Seattle', 'WA', 'US', 'West', 'Club', 500, 'booking@thecrocodile.com', ARRAY['Rock','Indie','Alternative'], NULL),
('Showbox', 'Seattle', 'WA', 'US', 'West', 'Theater', 1100, 'booking@showboxonline.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('Doug Fir Lounge', 'Portland', 'OR', 'US', 'West', 'Bar', 300, 'booking@dougfirlounge.com', ARRAY['Indie','Folk','Rock'], NULL),
('Wonder Ballroom', 'Portland', 'OR', 'US', 'West', 'Theater', 700, 'booking@wonderballroom.com', ARRAY['Rock','Electronic','Indie'], NULL),
('Revolution Hall', 'Portland', 'OR', 'US', 'West', 'Theater', 850, 'booking@revolutionhall.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Larimer Lounge', 'Denver', 'CO', 'US', 'West', 'Bar', 350, 'booking@larimerlounge.com', ARRAY['Rock','Indie','Electronic'], 'Denver''s best emerging artist stage.'),
('Bluebird Theater', 'Denver', 'CO', 'US', 'West', 'Theater', 550, 'booking@bluebirdtheater.net', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('Marquis Theater', 'Denver', 'CO', 'US', 'West', 'Theater', 700, 'booking@marquistheater.net', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Summit Music Hall', 'Denver', 'CO', 'US', 'West', 'Theater', 1200, 'booking@summitmusikhall.com', ARRAY['Electronic','Rock','Hip-Hop'], NULL),
('The Roundhouse', 'London', NULL, 'UK', 'International', 'Theater', 3300, 'booking@roundhouse.org.uk', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Brixton Academy', 'London', NULL, 'UK', 'International', 'Theater', 4921, 'booking@academymusicgroup.com', ARRAY['Rock','Pop','Electronic'], NULL),
('Fabric', 'London', NULL, 'UK', 'International', 'Club', 2500, 'booking@fabriclondon.com', ARRAY['Electronic','Techno','House'], NULL),
('The Jazz Cafe', 'London', NULL, 'UK', 'International', 'Club', 440, 'booking@thejazzcafelondon.com', ARRAY['Jazz','Soul','R&B'], NULL),
('Gorilla', 'Manchester', NULL, 'UK', 'International', 'Club', 500, 'booking@thisisgorilla.com', ARRAY['Indie','Electronic','Rock'], NULL),
('Paradiso', 'Amsterdam', NULL, 'Netherlands', 'International', 'Theater', 1500, 'booking@paradiso.nl', ARRAY['Electronic','Rock','Pop'], NULL),
('Melkweg', 'Amsterdam', NULL, 'Netherlands', 'International', 'Theater', 1500, 'booking@melkweg.nl', ARRAY['Electronic','Hip-Hop','Indie'], NULL),
('Berghain', 'Berlin', NULL, 'Germany', 'International', 'Club', 1500, 'booking@berghain.de', ARRAY['Electronic','Techno'], NULL),
('La Cigale', 'Paris', NULL, 'France', 'International', 'Theater', 1100, 'booking@lacigale.fr', ARRAY['Rock','Pop','Electronic'], NULL),
('The Corner Hotel', 'Melbourne', NULL, 'Australia', 'International', 'Club', 800, 'booking@cornerhotel.com.au', ARRAY['Rock','Indie','Electronic'], NULL),
('The Metro Theatre', 'Sydney', NULL, 'Australia', 'International', 'Theater', 1100, 'booking@metrotheatre.com.au', ARRAY['Rock','Indie','Hip-Hop'], NULL),
('The Phoenix', 'Toronto', NULL, 'Canada', 'International', 'Theater', 1400, 'booking@phoenixtoronto.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Lee''s Palace', 'Toronto', NULL, 'Canada', 'International', 'Club', 650, 'booking@leespalace.com', ARRAY['Rock','Indie','Alternative'], NULL),
('Commodore Ballroom', 'Vancouver', NULL, 'Canada', 'International', 'Theater', 1000, 'booking@commodoreballroom.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Club Soda', 'Montreal', NULL, 'Canada', 'International', 'Theater', 900, 'booking@clubsoda.ca', ARRAY['Rock','Pop','Hip-Hop'], NULL)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK 6: Seed data — Radio stations
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.radio_stations (name, call_sign, frequency, city, state, country, region, format, weekly_listeners, submission_email, notes) VALUES
('Hot 97', 'WQHT', '97.1 FM', 'New York', 'NY', 'US', 'Northeast', 'Hip-Hop', 2100000, 'music@hot97.com', 'The biggest Hip-Hop station in the US. Send Spotify + radio edit.'),
('Power 105.1', 'WWPR', '105.1 FM', 'New York', 'NY', 'US', 'Northeast', 'Hip-Hop', 1900000, 'music@power1051.com', NULL),
('WBLS', 'WBLS', '107.5 FM', 'New York', 'NY', 'US', 'Northeast', 'R&B', 1600000, 'music@wbls.com', NULL),
('KPWR Power 106', 'KPWR', '105.9 FM', 'Los Angeles', 'CA', 'US', 'West', 'Hip-Hop', 1800000, 'music@power106.com', NULL),
('V103 Atlanta', 'WVEE', '103.3 FM', 'Atlanta', 'GA', 'US', 'Southeast', 'R&B', 1200000, 'music@v103.com', NULL),
('Hot 107.9 Atlanta', 'WHTA', '107.9 FM', 'Atlanta', 'GA', 'US', 'Southeast', 'Hip-Hop', 1100000, 'music@hot1079atl.com', NULL),
('WGCI Chicago', 'WGCI', '107.5 FM', 'Chicago', 'IL', 'US', 'Midwest', 'Hip-Hop', 1100000, 'music@wgci.com', NULL),
('The Beat LA', 'KKBT', '100.3 FM', 'Los Angeles', 'CA', 'US', 'West', 'R&B', 1300000, 'music@thebeatla.com', NULL),
('99 Jamz Miami', 'WEDR', '99.1 FM', 'Miami', 'FL', 'US', 'Southeast', 'Hip-Hop', 880000, 'music@99jamz.com', NULL),
('The Box Houston', 'KBXX', '97.9 FM', 'Houston', 'TX', 'US', 'Southwest', 'Hip-Hop', 940000, 'music@thebox979.com', NULL),
('KISS 108 Boston', 'WXKS', '107.9 FM', 'Boston', 'MA', 'US', 'Northeast', 'Pop/R&B', 820000, 'music@kiss108.com', NULL),
('KMEL San Francisco', 'KMEL', '106.1 FM', 'San Francisco', 'CA', 'US', 'West', 'Hip-Hop', 920000, 'music@kmel.com', NULL),
('WPGC Washington DC', 'WPGC', '95.5 FM', 'Washington', 'DC', 'US', 'Northeast', 'Hip-Hop', 710000, 'music@wpgc.com', NULL),
('KCRW', 'KCRW', '89.9 FM', 'Santa Monica', 'CA', 'US', 'West', 'Indie/Alt', 650000, 'music@kcrw.com', 'Tastemaker station. NPR affiliate. Very influential for indie/alternative. Include streaming profile.'),
('KEXP', 'KEXP', '90.3 FM', 'Seattle', 'WA', 'US', 'West', 'Indie/Alt', 520000, 'music@kexp.org', 'Highly respected indie station. Live sessions + playlisting. Include Bandcamp/Spotify.'),
('WFMU', 'WFMU', '91.1 FM', 'Jersey City', 'NJ', 'US', 'Northeast', 'Eclectic', 290000, 'music@wfmu.org', 'Freeform. No commercial pressure. Experimental-friendly.'),
('WXPN Philadelphia', 'WXPN', '88.5 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'Indie/Adult', 460000, 'music@xpn.org', NULL),
('KUTX Austin', 'KUTX', '98.9 FM', 'Austin', 'TX', 'US', 'Southwest', 'Indie/Alt', 340000, 'music@kutx.org', 'Austin tastemaker. New Music Monday segment.'),
('WMBR Cambridge', 'WMBR', '88.1 FM', 'Cambridge', 'MA', 'US', 'Northeast', 'College', 95000, 'music@wmbr.org', 'MIT station. Great for indie and emerging artists.'),
('WDET Detroit', 'WDET', '101.9 FM', 'Detroit', 'MI', 'US', 'Midwest', 'Alt/NPR', 280000, 'music@wdet.org', NULL),
('WMOT Nashville', 'WMOT', '89.5 FM', 'Nashville', 'TN', 'US', 'Southeast', 'Indie/Alt', 95000, 'music@wmot.org', NULL),
('KDHX St. Louis', 'KDHX', '88.1 FM', 'St. Louis', 'MO', 'US', 'Midwest', 'Community', 82000, 'music@kdhx.org', 'Community freeform. Very open to indie submissions.'),
('BBC Radio 1Xtra', NULL, 'DAB/Online', 'London', NULL, 'UK', 'International', 'Hip-Hop', 3200000, 'music@bbc.co.uk', 'UK''s biggest Hip-Hop/R&B station. Submit via BBC Introducing.'),
('BBC Radio 6 Music', NULL, 'DAB/Online', 'London', NULL, 'UK', 'International', 'Indie/Alt', 2400000, 'music6@bbc.co.uk', 'UK tastemaker. Submit via BBC Introducing.'),
('NTS Radio', NULL, 'Online', 'London', NULL, 'UK', 'International', 'Eclectic', 850000, 'music@ntslive.co.uk', 'Online-only. Very open to underground and independent music.'),
('Triple J', NULL, '107.7 FM', 'Sydney', NULL, 'Australia', 'International', 'Indie/Alt', 1800000, 'music@abc.net.au', 'Australia''s biggest indie/alt station. Unearthed program for emerging artists.'),
-- College stations (verified with direct music director contacts)
('WVUA-FM (University of Alabama)', 'WVUA-FM', '90.7 FM', 'Tuscaloosa', 'AL', 'US', 'Southeast', 'Jazz/R&B', NULL, 'music@wvuafm.ua.edu', NULL),
('KALX 90.7 FM (UC Berkeley)', 'KALX', '90.7 FM', 'Berkeley', 'CA', 'US', 'West', 'College', NULL, 'music@kalx.berkeley.edu', 'Freeform / Eclectic College Radio'),
('KDVS 90.3 FM (UC Davis)', 'KDVS', '90.3 FM', 'Davis', 'CA', 'US', 'West', 'College', NULL, 'musicdept@kdvs.org', NULL),
('KJAZZ 88.1 FM (CSU Long Beach)', 'KJAZZ', '88.1 FM', 'Los Angeles', 'CA', 'US', 'West', 'Jazz/R&B', NULL, 'mlevine@kkjz.org', NULL),
('KCSN 88.5 FM (CSU Northridge)', 'KCSN', '88.5 FM', 'Northridge', 'CA', 'US', 'West', 'Indie/Alt', NULL, 'patrick@885fm.org', 'Adult Album Alternative'),
('KUCI 88.9 FM (UC Irvine)', 'KUCI', '88.9 FM', 'Irvine', 'CA', 'US', 'West', 'College', NULL, 'kevin@kuci.org', 'Freeform'),
('KSCU 103.3 FM (Santa Clara University)', 'KSCU', '103.3 FM', 'Santa Clara', 'CA', 'US', 'West', 'College', NULL, 'info@kscu.org', NULL),
('WERS 88.9 FM (Emerson College)', 'WERS', '88.9 FM', 'Boston', 'MA', 'US', 'Northeast', 'R&B', NULL, 'info@wers.org', 'Adult Album Alternative'),
('WHRB 95.3 FM (Harvard College)', 'WHRB', '95.3 FM', 'Cambridge', 'MA', 'US', 'Northeast', 'Hip-Hop', NULL, 'pd@whrb.org', NULL),
('WMFO 91.5 FM (Tufts University)', 'WMFO', '91.5 FM', 'Medford', 'MA', 'US', 'Northeast', 'College', NULL, 'wmfo.radio@gmail.com', 'Freeform'),
('WFUV 90.7 FM (Fordham University)', 'WFUV', '90.7 FM', 'Bronx', 'NY', 'US', 'Northeast', 'College', NULL, 'musicdept@wfuv.org', 'Adult Album Alternative / Public Radio'),
('WNYU 89.1 FM (New York University)', 'WNYU', '89.1 FM', 'New York', 'NY', 'US', 'Northeast', 'College', NULL, 'music@wnyu.org', NULL),
('WICB 91.7 FM (Ithaca College)', 'WICB', '91.7 FM', 'Ithaca', 'NY', 'US', 'Northeast', 'College', NULL, 'generalmanager@wicb.org', NULL),
('WKNC 88.1 FM (North Carolina State University)', 'WKNC', '88.1 FM', 'Raleigh', 'NC', 'US', 'Southeast', 'Hip-Hop', NULL, 'wknc-manager@ncsu.edu', NULL),
('WXDU 88.7 FM (Duke University)', 'WXDU', '88.7 FM', 'Durham', 'NC', 'US', 'Southeast', 'Hip-Hop', NULL, 'music@wxdu.org', 'Freeform'),
('WXYC 89.3 FM (University of North Carolina)', 'WXYC', '89.3 FM', 'Chapel Hill', 'NC', 'US', 'Southeast', 'Hip-Hop', NULL, 'md@wxyc.org', 'Freeform'),
('WREK 91.1 FM (Georgia Tech)', 'WREK', '91.1 FM', 'Atlanta', 'GA', 'US', 'Southeast', 'Hip-Hop', NULL, 'music@wrek.org', 'Freeform College Radio'),
('WCBN 88.3 FM (University of Michigan)', 'WCBN', '88.3 FM', 'Ann Arbor', 'MI', 'US', 'Midwest', 'Hip-Hop', NULL, 'music@wcbn.org', 'Freeform'),
('WDBM 89 FM / Impact 89FM (Michigan State University)', 'WDBM', '89.1 FM', 'East Lansing', 'MI', 'US', 'Midwest', 'Hip-Hop', NULL, 'impact89fm@gmail.com', NULL),
('KJHK 90.7 FM (University of Kansas)', 'KJHK', '90.7 FM', 'Lawrence', 'KS', 'US', 'Midwest', 'College', NULL, 'submitmusic@kjhk.org', 'Freeform / Alternative'),
('KRUI 89.7 FM (University of Iowa)', 'KRUI', '89.7 FM', 'Iowa City', 'IA', 'US', 'Midwest', 'Hip-Hop', NULL, 'eraefield@krui.fm', NULL),
('KVRX 91.7 FM (University of Texas, Austin)', 'KVRX', '91.7 FM', 'Austin', 'TX', 'US', 'Southwest', 'Hip-Hop', NULL, 'stationmanager@kvrx.org', 'Indie Rock / Hip-Hop / Blues / Jazz'),
('KTRU 91.7 FM (Rice University)', 'KTRU', '91.7 FM', 'Houston', 'TX', 'US', 'Southwest', 'Jazz/R&B', NULL, 'music@ktru.org', NULL),
('KAOS 89.3 FM (The Evergreen State College)', 'KAOS', '89.3 FM', 'Olympia', 'WA', 'US', 'West', 'College', NULL, 'kaosmusicdirector@gmail.com', 'Independent / Local Northwest Artists'),
('KPSU 98.1 FM (Portland State University)', 'KPSU', '98.1 FM', 'Portland', 'OR', 'US', 'West', 'College', NULL, 'manager@kpsu.org', NULL),
('WRVU 91.1 FM (Vanderbilt University)', 'WRVU', '91.1 FM', 'Nashville', 'TN', 'US', 'Southeast', 'College', NULL, 'wrvugm@gmail.com', 'Indie Rock / Alternative'),
('WUTK 90.3 FM (University of Tennessee)', 'WUTK', '90.3 FM', 'Knoxville', 'TN', 'US', 'Southeast', 'Hip-Hop', NULL, 'wutkmusic@gmail.com', NULL),
('WKDU 91.7 FM (Drexel University)', 'WKDU', '91.7 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'College', NULL, 'musicdirector@wkdu.org', 'Freeform / Eclectic'),
('WRCT 88.3 FM (Carnegie Mellon University)', 'WRCT', '88.3 FM', 'Pittsburgh', 'PA', 'US', 'Northeast', 'College', NULL, 'extmusic@wrct.org', 'Freeform / Eclectic')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK 7: Seed data — Sync companies
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.sync_companies (name, city, country, accepting, placement_credits, genres, placement_types, submission_email, notes) VALUES
('Musicbed', 'Fort Worth', 'US', true, ARRAY['Apple','Nike','Google'], ARRAY['Indie','Electronic','Cinematic','Folk'], ARRAY['Ad','Film','YouTube'], 'sync@musicbed.com', NULL),
('Artlist', 'Tel Aviv', 'International', true, ARRAY['Netflix','YouTube','Instagram'], ARRAY['Indie','Cinematic','Electronic','Pop'], ARRAY['Film','TV','Ad','Social'], 'sync@artlist.io', NULL),
('Epidemic Sound', 'Stockholm', 'International', true, ARRAY['YouTube','Netflix','Facebook'], ARRAY['Electronic','Pop','Hip-Hop','Cinematic'], ARRAY['YouTube','Social','Film','TV'], 'sync@epidemicsound.com', NULL),
('Pond5', 'New York', 'US', true, ARRAY['Discovery','NBC','ABC'], ARRAY['All Genres'], ARRAY['TV','Film','Ad','Game'], 'music@pond5.com', NULL),
('Crucial Music', 'Los Angeles', 'US', true, ARRAY['MTV','VH1','Bravo'], ARRAY['Pop','Rock','R&B','Hip-Hop'], ARRAY['TV','Ad'], 'music@crucialmusic.com', NULL),
('Position Music', 'Los Angeles', 'US', false, ARRAY['WB','Disney','Netflix'], ARRAY['Pop','Electronic','Hip-Hop','Rock'], ARRAY['Film','TV','Trailer'], 'sync@positionmusic.com', 'Invite only but they respond to strong pitches.'),
('Pump Audio', 'New York', 'US', true, ARRAY['ESPN','CNN','HBO'], ARRAY['All Genres'], ARRAY['TV','Ad','Game'], 'music@pumpaudio.com', NULL),
('Jingle Punks', 'New York', 'US', true, ARRAY['Discovery','Bravo','E!'], ARRAY['Pop','Electronic','Rock','Hip-Hop'], ARRAY['TV','Ad','Trailer'], 'submissions@jinglepunks.com', NULL),
('Marmoset', 'Portland', 'US', false, ARRAY['Apple','Google','Nike'], ARRAY['Indie','Electronic','Folk','Cinematic'], ARRAY['Ad','Film','YouTube'], 'sync@marmosetmusic.com', NULL),
('Sound Stripe', 'Nashville', 'US', true, ARRAY['YouTube','Vimeo','Social'], ARRAY['All Genres'], ARRAY['YouTube','Social','Ad'], 'sync@soundstripe.com', NULL),
('Music Vine', 'London', 'UK', true, ARRAY['BBC','Channel 4','Sky'], ARRAY['Indie','Electronic','Cinematic','Folk'], ARRAY['Film','TV','Ad'], 'sync@musicvine.com', NULL),
('Heavy Hitters Music', 'New York', 'US', false, ARRAY['BET','MTV','VH1'], ARRAY['Hip-Hop','R&B','Electronic'], ARRAY['TV','Ad','Film'], 'sync@heavyhittersmusic.com', NULL),
('Music Dealers', 'Chicago', 'US', true, ARRAY['ESPN','Coca-Cola','Samsung'], ARRAY['All Genres'], ARRAY['Ad','TV','Film'], 'sync@musicdealers.com', NULL),
('Audiio', 'New York', 'US', true, ARRAY['YouTube','Vimeo','Social'], ARRAY['Electronic','Cinematic','Pop','Indie'], ARRAY['YouTube','Social','Film'], 'sync@audiio.com', NULL),
('Studiocat', 'Atlanta', 'US', true, ARRAY['BET','OWN','Bounce TV'], ARRAY['Hip-Hop','R&B','Gospel','Soul'], ARRAY['TV','Ad'], 'sync@studiocat.com', 'Black-owned. Specializes in Black-targeted networks.'),
('Groove Guild', 'Brooklyn', 'US', true, ARRAY['Complex','The FADER','Pigeons & Planes'], ARRAY['Hip-Hop','R&B','Electronic','Indie'], ARRAY['YouTube','Social','Ad'], 'sync@grooveguild.co', NULL),
('Rumblefish', 'Portland', 'US', true, ARRAY['YouTube','Facebook','Instagram'], ARRAY['All Genres'], ARRAY['Social','YouTube','Ad'], 'sync@rumblefish.com', NULL),
('SyncFloor', 'Nashville', 'US', true, ARRAY['ESPN','Fox Sports','CBS Sports'], ARRAY['Country','Rock','Electronic','Hip-Hop'], ARRAY['TV','Ad','Sports'], 'sync@syncfloor.com', NULL),
('Hitpiece', 'Los Angeles', 'US', true, ARRAY['TikTok','YouTube','Instagram'], ARRAY['Pop','Hip-Hop','Electronic','R&B'], ARRAY['Social','Ad','YouTube'], 'sync@hitpiece.com', NULL),
('Musicgateway', 'London', 'UK', true, ARRAY['BBC','ITV','Netflix UK'], ARRAY['All Genres'], ARRAY['TV','Film','Ad','Game'], 'sync@musicgateway.com', NULL),
('Tracks & Fields', 'Berlin', 'International', false, ARRAY['Volkswagen','Porsche','Adidas'], ARRAY['Electronic','Indie','Cinematic'], ARRAY['Ad','Film','YouTube'], 'sync@tracksandfields.com', NULL),
('Music Supervisor Network', 'Los Angeles', 'US', false, ARRAY['HBO','Showtime','Netflix'], ARRAY['Indie','Alternative','Electronic','Hip-Hop'], ARRAY['TV','Film'], 'pitches@musicsupervisornetwork.com', NULL)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- PATCH 004: Beat licenses (Beat Licensing Manager persistence)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.beat_licenses (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id      text          NOT NULL,
  buyer        text          NOT NULL,
  license_type text          NOT NULL CHECK (license_type IN ('lease', 'exclusive')),
  amount       numeric(12,2) NOT NULL DEFAULT 0,
  license_date date          NOT NULL DEFAULT CURRENT_DATE,
  expires      date,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS beat_licenses_user_id_idx ON public.beat_licenses (user_id);
ALTER TABLE public.beat_licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "beat_licenses_owner" ON public.beat_licenses;
CREATE POLICY "beat_licenses_owner" ON public.beat_licenses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.beat_licenses TO authenticated, service_role;


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. All tables created, all seeds loaded.
-- Check: Tables → should see profiles, user_catalogs, waitlist, venues,
--        radio_stations, sync_companies, user_venue_pitches,
--        user_radio_submissions, user_sync_pitches, user_playlist_pitches,
--        blog_posts, user_notifications, beat_licenses
-- Check: Storage → should see vault-assets bucket (private, 50MB limit)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- PATCH 006: Guild follows + radio submission tracking (Wave 3 honesty pass)
-- (Same content as PATCH_006_guild_radio.sql — folded in per repo convention.)
-- ═══════════════════════════════════════════════════════════════════════════════

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

ALTER TABLE public.user_radio_submissions ALTER COLUMN station_id DROP NOT NULL;
ALTER TABLE public.user_radio_submissions ADD COLUMN IF NOT EXISTS station_name    text;
ALTER TABLE public.user_radio_submissions ADD COLUMN IF NOT EXISTS songs_submitted text[] NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS idx_radio_submissions_user_station_name
  ON public.user_radio_submissions (user_id, station_name) WHERE station_name IS NOT NULL;
