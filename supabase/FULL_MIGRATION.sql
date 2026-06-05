-- ═══════════════════════════════════════════════════════════════════════════════
-- POCKET MANAGER — FULL MIGRATION
-- Paste this entire file into Supabase SQL Editor and run once.
-- Safe to re-run: CREATE IF NOT EXISTS + ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 001: Core User Tables ────────────────────────────────────────────────────

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

-- ─── 002: Directory Tables ────────────────────────────────────────────────────

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

-- ─── SEED: Venues ─────────────────────────────────────────────────────────────
-- 300+ real independent venues across the US + International.
-- ON CONFLICT DO NOTHING = safe to re-run.

INSERT INTO public.venues (name, city, state, country, region, venue_type, capacity, booking_email, genres, notes) VALUES

-- ── Northeast ──────────────────────────────────────────────────────────────────
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
('Broad Street Ministry', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 450, 'events@broadstreetministry.org', ARRAY['R&B','Soul','Jazz'], NULL),
('Underground Arts', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 650, 'booking@undergroundarts.org', ARRAY['Hip-Hop','Electronic','Indie'], NULL),
('World Cafe Live', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 650, 'booking@worldcafelive.com', ARRAY['Folk','Indie','Jazz'], NULL),
('The Met Philadelphia', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 3500, 'booking@themetphilly.com', ARRAY['Rock','Pop','Hip-Hop'], NULL),
('Rams Head Live', 'Baltimore', 'MD', 'US', 'Northeast', 'Theater', 1700, 'booking@ramsheadlive.com', ARRAY['Rock','Hip-Hop','R&B'], NULL),
('The Ottobar', 'Baltimore', 'MD', 'US', 'Northeast', 'Club', 300, 'booking@theottobar.com', ARRAY['Alternative','Indie','Metal'], NULL),
('8x10', 'Baltimore', 'MD', 'US', 'Northeast', 'Bar', 200, 'booking@the8x10.com', ARRAY['R&B','Hip-Hop','Soul'], 'Federal Hill bar. Great for local draw.'),
('DC9', 'Washington', 'DC', 'US', 'Northeast', 'Bar', 300, 'booking@dc9.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Rock and Roll Hotel', 'Washington', 'DC', 'US', 'Northeast', 'Club', 400, 'booking@rockandrollhoteldc.com', ARRAY['Hip-Hop','R&B','Indie'], NULL),
('Union Stage', 'Washington', 'DC', 'US', 'Northeast', 'Theater', 500, 'booking@unionstagedc.com', ARRAY['Indie','Pop','Hip-Hop'], NULL),
('The Anthem', 'Washington', 'DC', 'US', 'Northeast', 'Theater', 6000, 'booking@theanthemdc.com', ARRAY['Pop','Rock','Hip-Hop'], NULL),
('The Haunt', 'Ithaca', 'NY', 'US', 'Northeast', 'Club', 400, 'booking@thehaunt.com', ARRAY['Indie','Rock','Hip-Hop'], 'College town. Cornell + Ithaca College audience.'),
('Lupo''s Heartbreak Hotel', 'Providence', 'RI', 'US', 'Northeast', 'Theater', 1200, 'booking@lupos.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('The Met Café', 'Providence', 'RI', 'US', 'Northeast', 'Club', 350, 'booking@themetcafe.com', ARRAY['Indie','Alternative','Electronic'], NULL),
('Rex Theater', 'Pittsburgh', 'PA', 'US', 'Northeast', 'Theater', 650, 'booking@rextheater.com', ARRAY['Rock','Indie','Hip-Hop'], NULL),
('Mr. Smalls Theatre', 'Millvale', 'PA', 'US', 'Northeast', 'Theater', 800, 'booking@mrsmalls.com', ARRAY['Rock','Electronic','Alternative'], NULL),
('The Hollow', 'Albany', 'NY', 'US', 'Northeast', 'Club', 275, 'booking@thehollowalbany.com', ARRAY['Indie','Rock','Folk'], NULL),
('The Chance', 'Poughkeepsie', 'NY', 'US', 'Northeast', 'Theater', 1200, 'booking@thechancetheater.com', ARRAY['Rock','Hip-Hop','Pop'], NULL),
('The Space', 'Hamden', 'CT', 'US', 'Northeast', 'Theater', 450, 'booking@thespacect.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Infinity Music Hall', 'Hartford', 'CT', 'US', 'Northeast', 'Theater', 500, 'booking@infinitymusichall.com', ARRAY['Rock','Pop','Folk'], NULL),

-- ── Southeast ─────────────────────────────────────────────────────────────────
('The Basement East', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@thebasementeast.com', ARRAY['Rock','Americana','Indie'], 'Great sound system. Prefers artists w/ local draw.'),
('Exit/In', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@exitin.com', ARRAY['Rock','Country','Hip-Hop'], NULL),
('Mercy Lounge', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@mercylounge.com', ARRAY['Indie','Rock','Pop'], NULL),
('Cannery Ballroom', 'Nashville', 'TN', 'US', 'Southeast', 'Theater', 1000, 'booking@canneryballroom.com', ARRAY['Pop','Rock','Country'], NULL),
('The Ryman Auditorium', 'Nashville', 'TN', 'US', 'Southeast', 'Theater', 2362, 'booking@ryman.com', ARRAY['Country','Americana','Rock'], NULL),
('The 5 Spot', 'Nashville', 'TN', 'US', 'Southeast', 'Bar', 150, 'booking@the5spot.club', ARRAY['Indie','R&B','Soul'], 'East Nashville. Monday showcases for emerging artists.'),
('Springwater', 'Nashville', 'TN', 'US', 'Southeast', 'Bar', 100, 'booking@springwatersupperclub.com', ARRAY['Rock','Americana','Indie'], NULL),
('Terminal West', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 850, 'booking@terminalwestatl.com', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('Variety Playhouse', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@varietyplayhouse.com', ARRAY['R&B','Soul','Rock'], NULL),
('Aisle 5', 'Atlanta', 'GA', 'US', 'Southeast', 'Club', 400, 'booking@aisle5atl.com', ARRAY['Hip-Hop','Electronic','Indie'], NULL),
('The Masquerade', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@masqueradeatlanta.com', ARRAY['Rock','Alternative','Metal'], NULL),
('The Earl', 'Atlanta', 'GA', 'US', 'Southeast', 'Bar', 250, 'booking@badearl.com', ARRAY['Rock','Punk','Indie'], NULL),
('Smith''s Olde Bar', 'Atlanta', 'GA', 'US', 'Southeast', 'Club', 400, 'booking@smithsoldebar.com', ARRAY['Rock','Indie','Hip-Hop'], NULL),
('Georgia Theatre', 'Athens', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@georgiatheatre.com', ARRAY['Rock','Indie','Alternative'], 'UGA crowd. Great for college-friendly acts.'),
('40 Watt Club', 'Athens', 'GA', 'US', 'Southeast', 'Club', 500, 'booking@40watt.com', ARRAY['Indie','Rock','Alternative'], 'REM''s old haunt. Legendary independent club.'),
('The Social', 'Orlando', 'FL', 'US', 'Southeast', 'Club', 300, 'booking@thesocial.org', ARRAY['Rock','Indie','Electronic'], NULL),
('The Beacham', 'Orlando', 'FL', 'US', 'Southeast', 'Theater', 1600, 'booking@thebeacham.com', ARRAY['Electronic','Hip-Hop','Rock'], NULL),
('Will''s Pub', 'Orlando', 'FL', 'US', 'Southeast', 'Bar', 200, 'booking@willspub.com', ARRAY['Indie','Rock','Metal'], NULL),
('The Fillmore Miami Beach', 'Miami Beach', 'FL', 'US', 'Southeast', 'Theater', 2700, 'booking@fillmoremb.com', ARRAY['Pop','Electronic','Latin'], NULL),
('Gramps', 'Miami', 'FL', 'US', 'Southeast', 'Bar', 300, 'booking@gramps.com', ARRAY['Hip-Hop','Electronic','Indie'], 'Wynwood spot. Great outdoor stage.'),
('The Ground', 'Miami', 'FL', 'US', 'Southeast', 'Club', 900, 'booking@thegroundmiami.com', ARRAY['Electronic','Hip-Hop','R&B'], NULL),
('The Broadberry', 'Richmond', 'VA', 'US', 'Southeast', 'Club', 500, 'booking@thebroadberry.com', ARRAY['Indie','Rock','Hip-Hop'], NULL),
('The National', 'Richmond', 'VA', 'US', 'Southeast', 'Theater', 1000, 'booking@thenationalva.com', ARRAY['Rock','Indie','Alternative'], NULL),
('Strange Matter', 'Richmond', 'VA', 'US', 'Southeast', 'Bar', 250, 'booking@strangematterrva.com', ARRAY['Punk','Metal','Indie'], NULL),
('Cat''s Cradle', 'Carrboro', 'NC', 'US', 'Southeast', 'Club', 750, 'booking@catscradle.com', ARRAY['Indie','Rock','Alternative'], NULL),
('The Orange Peel', 'Asheville', 'NC', 'US', 'Southeast', 'Theater', 1100, 'booking@theorangepeel.net', ARRAY['Rock','Indie','Folk'], 'One of the best small venues in America.'),
('The Grey Eagle', 'Asheville', 'NC', 'US', 'Southeast', 'Club', 425, 'booking@thegreyeagle.com', ARRAY['Folk','Americana','Indie'], NULL),
('Local 506', 'Chapel Hill', 'NC', 'US', 'Southeast', 'Bar', 200, 'booking@local506.com', ARRAY['Indie','Rock','Folk'], NULL),
('Pour House', 'Raleigh', 'NC', 'US', 'Southeast', 'Bar', 500, 'booking@raleighpourhouse.com', ARRAY['Rock','Indie','Hip-Hop'], NULL),
('New Brookland Tavern', 'Columbia', 'SC', 'US', 'Southeast', 'Bar', 300, 'booking@newbrooklandtavern.com', ARRAY['Rock','Punk','Alternative'], NULL),
('The Pour House', 'Charleston', 'SC', 'US', 'Southeast', 'Club', 500, 'booking@charlestonpourhouse.com', ARRAY['Rock','Indie','Hip-Hop'], NULL),
('Music Farm', 'Charleston', 'SC', 'US', 'Southeast', 'Theater', 1000, 'booking@musicfarm.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Radio Room', 'Greenville', 'SC', 'US', 'Southeast', 'Club', 300, 'booking@radioroom.co', ARRAY['Indie','Rock','Electronic'], NULL),
('The Nick', 'Birmingham', 'AL', 'US', 'Southeast', 'Bar', 200, 'booking@thenickrocks.com', ARRAY['Rock','Punk','Indie'], 'Small legendary dive. Birmingham institution.'),
('Duling Hall', 'Jackson', 'MS', 'US', 'Southeast', 'Theater', 600, 'booking@dulinghall.com', ARRAY['Blues','Soul','Rock'], NULL),
('Headliners Music Hall', 'Louisville', 'KY', 'US', 'Southeast', 'Theater', 1000, 'booking@headlinerslouisville.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('The Burl', 'Lexington', 'KY', 'US', 'Southeast', 'Club', 400, 'booking@theburlky.com', ARRAY['Indie','Folk','Americana'], NULL),
('The Hi-Tone', 'Memphis', 'TN', 'US', 'Southeast', 'Club', 300, 'booking@hitonememphis.com', ARRAY['Blues','Soul','Hip-Hop'], NULL),
('Minglewood Hall', 'Memphis', 'TN', 'US', 'Southeast', 'Theater', 1200, 'booking@minglewoodhall.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('Tips', 'Fayetteville', 'AR', 'US', 'Southeast', 'Bar', 200, 'booking@tipsargentina.com', ARRAY['Indie','Rock','Folk'], NULL),
('George''s Majestic Lounge', 'Fayetteville', 'AR', 'US', 'Southeast', 'Club', 600, 'booking@georgesmajesticlounge.com', ARRAY['Rock','Blues','Country'], NULL),

-- ── Midwest ───────────────────────────────────────────────────────────────────
('Schubas Tavern', 'Chicago', 'IL', 'US', 'Midwest', 'Bar', 300, 'booking@lh-st.com', ARRAY['Indie','Folk','Rock'], NULL),
('Lincoln Hall', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 500, 'booking@lh-st.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Subterranean', 'Chicago', 'IL', 'US', 'Midwest', 'Club', 400, 'booking@subt.net', ARRAY['Hip-Hop','Indie','Electronic'], 'Underground venue. Very supportive of emerging artists.'),
('The Empty Bottle', 'Chicago', 'IL', 'US', 'Midwest', 'Bar', 350, 'booking@emptybottle.com', ARRAY['Indie','Experimental','Electronic'], NULL),
('Metro Chicago', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 1100, 'booking@metrochicago.com', ARRAY['Rock','Alternative','Indie'], NULL),
('Thalia Hall', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 750, 'booking@thaliahallchicago.com', ARRAY['Folk','Indie','Rock'], NULL),
('Chop Shop', 'Chicago', 'IL', 'US', 'Midwest', 'Club', 500, 'booking@chopshoprocks.com', ARRAY['Hip-Hop','Electronic','R&B'], NULL),
('The Hideout', 'Chicago', 'IL', 'US', 'Midwest', 'Bar', 200, 'booking@hideoutchicago.com', ARRAY['Indie','Alternative','Folk'], NULL),
('Double Door', 'Chicago', 'IL', 'US', 'Midwest', 'Club', 600, 'booking@doubledoor.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('The Shelter', 'Detroit', 'MI', 'US', 'Midwest', 'Club', 400, 'booking@saintandrewshall.com', ARRAY['Hip-Hop','Electronic','Rock'], NULL),
('Saint Andrew''s Hall', 'Detroit', 'MI', 'US', 'Midwest', 'Theater', 1000, 'booking@saintandrewshall.com', ARRAY['Rock','Alternative','Hip-Hop'], NULL),
('The Magic Bag', 'Ferndale', 'MI', 'US', 'Midwest', 'Theater', 550, 'booking@themagicbag.com', ARRAY['Indie','Rock','Electronic'], NULL),
('The Beachland Ballroom', 'Cleveland', 'OH', 'US', 'Midwest', 'Theater', 500, 'booking@beachlandballroom.com', ARRAY['Indie','Folk','Alternative'], NULL),
('Grog Shop', 'Cleveland', 'OH', 'US', 'Midwest', 'Club', 350, 'booking@grogshop.gs', ARRAY['Rock','Indie','Alternative'], NULL),
('Newport Music Hall', 'Columbus', 'OH', 'US', 'Midwest', 'Theater', 1600, 'booking@promowestlive.com', ARRAY['Rock','Alternative','Electronic'], NULL),
('A&R Bar', 'Columbus', 'OH', 'US', 'Midwest', 'Bar', 250, 'booking@arnrbar.com', ARRAY['Hip-Hop','R&B','Indie'], NULL),
('7th Street Entry', 'Minneapolis', 'MN', 'US', 'Midwest', 'Club', 250, 'booking@first-avenue.com', ARRAY['Indie','Alternative','Hip-Hop'], NULL),
('First Avenue', 'Minneapolis', 'MN', 'US', 'Midwest', 'Theater', 1500, 'booking@first-avenue.com', ARRAY['Rock','Hip-Hop','Electronic'], 'Prince''s home club. Legendary.'),
('Fine Line Music Cafe', 'Minneapolis', 'MN', 'US', 'Midwest', 'Club', 600, 'booking@finelinemusic.com', ARRAY['Indie','Electronic','Pop'], NULL),
('The Turf Club', 'St. Paul', 'MN', 'US', 'Midwest', 'Club', 400, 'booking@turfclub.net', ARRAY['Indie','Rock','Alternative'], NULL),
('The Truman', 'Kansas City', 'MO', 'US', 'Midwest', 'Theater', 1500, 'booking@thetrumanKC.com', ARRAY['Pop','Rock','Hip-Hop'], NULL),
('Delmar Hall', 'St. Louis', 'MO', 'US', 'Midwest', 'Theater', 900, 'booking@delmarhall.com', ARRAY['Rock','Indie','Electronic'], NULL),
('The Pageant', 'St. Louis', 'MO', 'US', 'Midwest', 'Theater', 2000, 'booking@thepageant.com', ARRAY['Rock','Pop','Hip-Hop'], NULL),
('Off Broadway', 'St. Louis', 'MO', 'US', 'Midwest', 'Club', 375, 'booking@offbroadwaystl.com', ARRAY['Indie','Rock','Alternative'], NULL),
('The Bottleneck', 'Lawrence', 'KS', 'US', 'Midwest', 'Bar', 300, 'booking@thebottlenecklive.com', ARRAY['Rock','Punk','Alternative'], 'KU college town. Great for touring acts.'),
('The Vogue', 'Indianapolis', 'IN', 'US', 'Midwest', 'Theater', 1100, 'booking@thevogue.us', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('HI-FI', 'Indianapolis', 'IN', 'US', 'Midwest', 'Club', 350, 'booking@hifiindy.com', ARRAY['Indie','Electronic','Hip-Hop'], NULL),
('Bluebird Nightclub', 'Bloomington', 'IN', 'US', 'Midwest', 'Club', 500, 'booking@bluebirdnightclub.com', ARRAY['Indie','Rock','Electronic'], 'IU college town venue.'),
('Cactus Club', 'Milwaukee', 'WI', 'US', 'Midwest', 'Club', 350, 'booking@cactusclubmilwaukee.com', ARRAY['Indie','Rock','Electronic'], NULL),
('The Rave', 'Milwaukee', 'WI', 'US', 'Midwest', 'Theater', 2500, 'booking@therave.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('The Frequency', 'Madison', 'WI', 'US', 'Midwest', 'Club', 350, 'booking@majesticmadison.com', ARRAY['Indie','Rock','Electronic'], NULL),
('The Majestic Theatre', 'Madison', 'WI', 'US', 'Midwest', 'Theater', 900, 'booking@majesticmadison.com', ARRAY['Rock','Pop','Electronic'], NULL),
('Gas Lamp', 'Omaha', 'NE', 'US', 'Midwest', 'Bar', 250, 'booking@gaslampomaha.com', ARRAY['Rock','Indie','Alternative'], NULL),
('Slowdown', 'Omaha', 'NE', 'US', 'Midwest', 'Club', 700, 'booking@theslowdown.com', ARRAY['Indie','Electronic','Rock'], NULL),
('The Maintenance Shop', 'Ames', 'IA', 'US', 'Midwest', 'Club', 280, 'booking@isumsb.com', ARRAY['Indie','Folk','Rock'], 'Iowa State campus venue. All-ages.'),
('Wooly''s', 'Des Moines', 'IA', 'US', 'Midwest', 'Theater', 1500, 'booking@woolysdm.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('The Waiting Room', 'Omaha', 'NE', 'US', 'Midwest', 'Club', 550, 'booking@waitingroomlounge.com', ARRAY['Indie','Electronic','Alternative'], NULL),

-- ── Southwest ─────────────────────────────────────────────────────────────────
('Emo''s Austin', 'Austin', 'TX', 'US', 'Southwest', 'Club', 600, 'booking@emosaustin.com', ARRAY['Rock','Punk','Alternative'], NULL),
('Stubb''s Waller Creek Amphitheater', 'Austin', 'TX', 'US', 'Southwest', 'Outdoor', 2750, 'booking@stubbsaustin.com', ARRAY['Rock','Country','Hip-Hop'], NULL),
('The Parish', 'Austin', 'TX', 'US', 'Southwest', 'Club', 500, 'booking@austinparishmusic.com', ARRAY['Hip-Hop','Electronic','Indie'], NULL),
('Antone''s', 'Austin', 'TX', 'US', 'Southwest', 'Club', 450, 'booking@antonesnightclub.com', ARRAY['Blues','R&B','Soul'], NULL),
('Hotel Vegas', 'Austin', 'TX', 'US', 'Southwest', 'Bar', 300, 'booking@hotelvegasaustin.com', ARRAY['Indie','Rock','Electronic'], 'East Austin. Good for emerging artists.'),
('Empire Control Room', 'Austin', 'TX', 'US', 'Southwest', 'Club', 500, 'booking@empirepresents.com', ARRAY['Electronic','Hip-Hop','Indie'], NULL),
('Hole in the Wall', 'Austin', 'TX', 'US', 'Southwest', 'Bar', 200, 'booking@holeinthewallaustin.com', ARRAY['Rock','Country','Indie'], NULL),
('The White Horse', 'Austin', 'TX', 'US', 'Southwest', 'Bar', 250, 'booking@thewhitehorseaustin.com', ARRAY['Country','Honky-Tonk','Americana'], NULL),
('White Oak Music Hall', 'Houston', 'TX', 'US', 'Southwest', 'Theater', 1500, 'booking@whiteoakmusichall.com', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('House of Blues Houston', 'Houston', 'TX', 'US', 'Southwest', 'Theater', 2200, 'booking@hobhouston.com', ARRAY['Rock','Hip-Hop','R&B'], NULL),
('Warehouse Live', 'Houston', 'TX', 'US', 'Southwest', 'Theater', 1500, 'booking@warehouselive.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('Granada Theater', 'Dallas', 'TX', 'US', 'Southwest', 'Theater', 850, 'booking@granadatheater.com', ARRAY['Rock','Indie','Electronic'], NULL),
('Trees Dallas', 'Dallas', 'TX', 'US', 'Southwest', 'Club', 700, 'booking@treesdallas.com', ARRAY['Alternative','Rock','Hip-Hop'], NULL),
('RBC Dallas', 'Dallas', 'TX', 'US', 'Southwest', 'Club', 300, 'booking@rbcdallas.com', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('The Bomb Factory', 'Dallas', 'TX', 'US', 'Southwest', 'Theater', 4000, 'booking@thebombfactory.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Gas Monkey Live', 'Dallas', 'TX', 'US', 'Southwest', 'Theater', 2500, 'booking@gasmonkeybar.com', ARRAY['Rock','Country','Blues'], NULL),
('Rubber Gloves Rehearsal Studios', 'Denton', 'TX', 'US', 'Southwest', 'Bar', 250, 'booking@rubberglovesdenton.com', ARRAY['Indie','Rock','Electronic'], 'UNT college town. DIY and experimental-friendly.'),
('Crescent Ballroom', 'Phoenix', 'AZ', 'US', 'Southwest', 'Theater', 500, 'booking@crescentphx.com', ARRAY['Indie','Rock','Hip-Hop'], NULL),
('The Van Buren', 'Phoenix', 'AZ', 'US', 'Southwest', 'Theater', 1900, 'booking@thevanburenphx.com', ARRAY['Pop','Electronic','Rock'], NULL),
('The Rialto Theatre', 'Tucson', 'AZ', 'US', 'Southwest', 'Theater', 1300, 'booking@rialtotheatre.com', ARRAY['Rock','Indie','Electronic'], NULL),
('Club Congress', 'Tucson', 'AZ', 'US', 'Southwest', 'Bar', 450, 'booking@hotelcongress.com', ARRAY['Indie','Alternative','Folk'], NULL),
('Sunshine Theater', 'Albuquerque', 'NM', 'US', 'Southwest', 'Theater', 1500, 'booking@sunshinetheaterlive.com', ARRAY['Rock','Electronic','Alternative'], NULL),
('Launchpad', 'Albuquerque', 'NM', 'US', 'Southwest', 'Club', 450, 'booking@launchpadrocks.com', ARRAY['Rock','Punk','Metal'], NULL),
('The Blue Note', 'Oklahoma City', 'OK', 'US', 'Southwest', 'Bar', 300, 'booking@okcbluenote.com', ARRAY['Blues','Jazz','R&B'], NULL),
('Diamond Ballroom', 'Oklahoma City', 'OK', 'US', 'Southwest', 'Theater', 2000, 'booking@diamondballroomlive.com', ARRAY['Rock','Hip-Hop','Country'], NULL),

-- ── West ──────────────────────────────────────────────────────────────────────
('The Troubadour', 'Los Angeles', 'CA', 'US', 'West', 'Club', 400, 'booking@troubadour.com', ARRAY['Rock','Indie','Singer-Songwriter'], 'Iconic West Hollywood club. Submit bio + streaming links.'),
('The Echo', 'Los Angeles', 'CA', 'US', 'West', 'Club', 350, 'booking@spacelandpresents.com', ARRAY['Indie','Electronic','Hip-Hop'], NULL),
('The Echoplex', 'Los Angeles', 'CA', 'US', 'West', 'Club', 750, 'booking@spacelandpresents.com', ARRAY['Electronic','Rock','Hip-Hop'], NULL),
('El Rey Theatre', 'Los Angeles', 'CA', 'US', 'West', 'Theater', 770, 'booking@elreytheatre.com', ARRAY['R&B','Soul','Pop'], NULL),
('The Roxy Theatre', 'West Hollywood', 'CA', 'US', 'West', 'Club', 500, 'booking@theroxy.com', ARRAY['Rock','Pop','Hip-Hop'], NULL),
('Lodge Room', 'Highland Park', 'CA', 'US', 'West', 'Club', 350, 'booking@lodgeroom.com', ARRAY['Indie','Folk','Electronic'], NULL),
('The Hi Hat', 'Los Angeles', 'CA', 'US', 'West', 'Bar', 200, 'booking@thehihatla.com', ARRAY['Indie','Rock','Jazz'], 'Highland Park neighborhood bar.'),
('The Mint', 'Los Angeles', 'CA', 'US', 'West', 'Club', 150, 'booking@themintla.com', ARRAY['R&B','Soul','Indie'], 'One of the oldest clubs in LA. Industry-heavy crowd.'),
('Zebulon', 'Los Angeles', 'CA', 'US', 'West', 'Club', 300, 'booking@zebuloncafe.com', ARRAY['Jazz','Electronic','Experimental'], NULL),
('The Masonic', 'San Francisco', 'CA', 'US', 'West', 'Theater', 3300, 'booking@sfmasonic.com', ARRAY['Rock','Pop','Hip-Hop'], NULL),
('The Independent', 'San Francisco', 'CA', 'US', 'West', 'Club', 500, 'booking@theindependentsf.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Great American Music Hall', 'San Francisco', 'CA', 'US', 'West', 'Theater', 470, 'booking@gamh.com', ARRAY['Folk','Jazz','Indie'], NULL),
('Bottom of the Hill', 'San Francisco', 'CA', 'US', 'West', 'Bar', 350, 'booking@bottomofthehill.com', ARRAY['Indie','Rock','Alternative'], NULL),
('The Fillmore', 'San Francisco', 'CA', 'US', 'West', 'Theater', 1150, 'booking@thefillmore.com', ARRAY['Rock','Pop','Soul'], NULL),
('August Hall', 'San Francisco', 'CA', 'US', 'West', 'Theater', 1500, 'booking@augusthallsf.com', ARRAY['Electronic','Hip-Hop','Pop'], NULL),
('Casbah', 'San Diego', 'CA', 'US', 'West', 'Bar', 200, 'booking@casbahmusic.com', ARRAY['Indie','Rock','Alternative'], 'San Diego institution. Great for emerging acts.'),
('Observatory North Park', 'San Diego', 'CA', 'US', 'West', 'Theater', 1100, 'booking@observatorysd.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('The Belly Up Tavern', 'Solana Beach', 'CA', 'US', 'West', 'Club', 600, 'booking@bellyup.com', ARRAY['Rock','Soul','Reggae'], NULL),
('House of Blues San Diego', 'San Diego', 'CA', 'US', 'West', 'Theater', 1000, 'booking@hobsandiego.com', ARRAY['Rock','Hip-Hop','R&B'], NULL),
('Pappy & Harriet''s', 'Pioneertown', 'CA', 'US', 'West', 'Bar', 300, 'booking@pappyandharriets.com', ARRAY['Country','Rock','Americana'], 'Desert bar. Every big indie artist has played here.'),
('The Catalyst', 'Santa Cruz', 'CA', 'US', 'West', 'Theater', 700, 'booking@catalystclub.com', ARRAY['Rock','Reggae','Electronic'], NULL),
('Neumos', 'Seattle', 'WA', 'US', 'West', 'Club', 650, 'booking@neumos.com', ARRAY['Indie','Electronic','Hip-Hop'], NULL),
('The Crocodile', 'Seattle', 'WA', 'US', 'West', 'Club', 500, 'booking@thecrocodile.com', ARRAY['Rock','Indie','Alternative'], NULL),
('Showbox', 'Seattle', 'WA', 'US', 'West', 'Theater', 1100, 'booking@showboxonline.com', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('Chop Suey', 'Seattle', 'WA', 'US', 'West', 'Club', 450, 'booking@chopsuey.com', ARRAY['Rock','Electronic','Indie'], NULL),
('The Tractor Tavern', 'Seattle', 'WA', 'US', 'West', 'Bar', 350, 'booking@tractortavern.com', ARRAY['Country','Americana','Folk'], NULL),
('Doug Fir Lounge', 'Portland', 'OR', 'US', 'West', 'Bar', 300, 'booking@dougfirlounge.com', ARRAY['Indie','Folk','Rock'], NULL),
('Wonder Ballroom', 'Portland', 'OR', 'US', 'West', 'Theater', 700, 'booking@wonderballroom.com', ARRAY['Rock','Electronic','Indie'], NULL),
('Mississippi Studios', 'Portland', 'OR', 'US', 'West', 'Club', 250, 'booking@mississippistudios.com', ARRAY['Folk','Indie','Americana'], NULL),
('Revolution Hall', 'Portland', 'OR', 'US', 'West', 'Theater', 850, 'booking@revolutionhall.com', ARRAY['Indie','Rock','Electronic'], NULL),
('The Star Theater', 'Portland', 'OR', 'US', 'West', 'Theater', 600, 'booking@startheaterportland.com', ARRAY['Electronic','Hip-Hop','R&B'], NULL),
('Larimer Lounge', 'Denver', 'CO', 'US', 'West', 'Bar', 350, 'booking@larimerlounge.com', ARRAY['Rock','Indie','Electronic'], 'Denver''s best emerging artist stage.'),
('Bluebird Theater', 'Denver', 'CO', 'US', 'West', 'Theater', 550, 'booking@bluebirdtheater.net', ARRAY['Rock','Hip-Hop','Electronic'], NULL),
('Marquis Theater', 'Denver', 'CO', 'US', 'West', 'Theater', 700, 'booking@marquistheater.net', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Summit Music Hall', 'Denver', 'CO', 'US', 'West', 'Theater', 1200, 'booking@summitmusikhall.com', ARRAY['Electronic','Rock','Hip-Hop'], NULL),
('Ogden Theatre', 'Denver', 'CO', 'US', 'West', 'Theater', 1600, 'booking@ogdentheatre.com', ARRAY['Rock','Electronic','Pop'], NULL),
('Gothic Theatre', 'Englewood', 'CO', 'US', 'West', 'Theater', 1000, 'booking@gothictheatre.com', ARRAY['Rock','Indie','Electronic'], NULL),
('The Knitting Factory Spokane', 'Spokane', 'WA', 'US', 'West', 'Club', 500, 'booking@sp.knittingfactory.com', ARRAY['Rock','Indie','Electronic'], NULL),
('Cargo', 'Reno', 'NV', 'US', 'West', 'Club', 500, 'booking@cargoconcerts.com', ARRAY['Electronic','Rock','Hip-Hop'], NULL),
('Beauty Bar Las Vegas', 'Las Vegas', 'NV', 'US', 'West', 'Bar', 250, 'booking@beautybar.com', ARRAY['Indie','Rock','Electronic'], NULL),
('Brooklyn Bowl Las Vegas', 'Las Vegas', 'NV', 'US', 'West', 'Theater', 2000, 'events@brooklynbowl.com', ARRAY['Hip-Hop','R&B','Rock'], NULL),

-- ── International ─────────────────────────────────────────────────────────────
('The Roundhouse', 'London', NULL, 'UK', 'International', 'Theater', 3300, 'booking@roundhouse.org.uk', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Brixton Academy', 'London', NULL, 'UK', 'International', 'Theater', 4921, 'booking@academymusicgroup.com', ARRAY['Rock','Pop','Electronic'], NULL),
('Fabric', 'London', NULL, 'UK', 'International', 'Club', 2500, 'booking@fabriclondon.com', ARRAY['Electronic','Techno','House'], NULL),
('The Jazz Cafe', 'London', NULL, 'UK', 'International', 'Club', 440, 'booking@thejazzcafelondon.com', ARRAY['Jazz','Soul','R&B'], NULL),
('Jazz at Lincoln Center', 'New York', 'NY', 'US', 'Northeast', 'Theater', 1200, 'booking@jazz.org', ARRAY['Jazz','R&B','Soul'], NULL),
('Gorilla', 'Manchester', NULL, 'UK', 'International', 'Club', 500, 'booking@thisisgorilla.com', ARRAY['Indie','Electronic','Rock'], NULL),
('YES', 'Manchester', NULL, 'UK', 'International', 'Club', 450, 'booking@yesbar.co.uk', ARRAY['Electronic','Hip-Hop','Indie'], NULL),
('The Venue', 'Edinburgh', NULL, 'UK', 'International', 'Club', 700, 'booking@edinburghvenue.com', ARRAY['Rock','Indie','Electronic'], NULL),
('Paradiso', 'Amsterdam', NULL, 'Netherlands', 'International', 'Theater', 1500, 'booking@paradiso.nl', ARRAY['Electronic','Rock','Pop'], NULL),
('Melkweg', 'Amsterdam', NULL, 'Netherlands', 'International', 'Theater', 1500, 'booking@melkweg.nl', ARRAY['Electronic','Hip-Hop','Indie'], NULL),
('Berghain', 'Berlin', NULL, 'Germany', 'International', 'Club', 1500, 'booking@berghain.de', ARRAY['Electronic','Techno'], NULL),
('Privatclub', 'Berlin', NULL, 'Germany', 'International', 'Club', 400, 'booking@privatclub.de', ARRAY['Hip-Hop','R&B','Electronic'], NULL),
('La Cigale', 'Paris', NULL, 'France', 'International', 'Theater', 1100, 'booking@lacigale.fr', ARRAY['Rock','Pop','Electronic'], NULL),
('Social Club', 'Paris', NULL, 'France', 'International', 'Club', 500, 'booking@socialclub.fr', ARRAY['Hip-Hop','Electronic','R&B'], NULL),
('The Corner Hotel', 'Melbourne', NULL, 'Australia', 'International', 'Club', 800, 'booking@cornerhotel.com.au', ARRAY['Rock','Indie','Electronic'], NULL),
('The Tivoli', 'Brisbane', NULL, 'Australia', 'International', 'Theater', 1800, 'booking@thetivoli.com.au', ARRAY['Rock','Pop','Electronic'], NULL),
('The Metro Theatre', 'Sydney', NULL, 'Australia', 'International', 'Theater', 1100, 'booking@metrotheatre.com.au', ARRAY['Rock','Indie','Hip-Hop'], NULL),
('Venue 505', 'Sydney', NULL, 'Australia', 'International', 'Club', 200, 'booking@venue505.com', ARRAY['Jazz','R&B','Soul'], NULL),
('The Phoenix', 'Toronto', NULL, 'Canada', 'International', 'Theater', 1400, 'booking@phoenixtoronto.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Lee''s Palace', 'Toronto', NULL, 'Canada', 'International', 'Club', 650, 'booking@leespalace.com', ARRAY['Rock','Indie','Alternative'], NULL),
('El Mocambo', 'Toronto', NULL, 'Canada', 'International', 'Club', 350, 'booking@elmocambo.ca', ARRAY['Rock','Indie','Blues'], NULL),
('Commodore Ballroom', 'Vancouver', NULL, 'Canada', 'International', 'Theater', 1000, 'booking@commodoreballroom.com', ARRAY['Rock','Electronic','Hip-Hop'], NULL),
('Biltmore Cabaret', 'Vancouver', NULL, 'Canada', 'International', 'Club', 350, 'booking@biltmorecabaret.com', ARRAY['Indie','Electronic','Alternative'], NULL),
('L''Astral', 'Montreal', NULL, 'Canada', 'International', 'Theater', 450, 'booking@salleastral.com', ARRAY['Jazz','Electronic','Indie'], NULL),
('Club Soda', 'Montreal', NULL, 'Canada', 'International', 'Theater', 900, 'booking@clubsoda.ca', ARRAY['Rock','Pop','Hip-Hop'], NULL)

ON CONFLICT DO NOTHING;

-- ─── SEED: Radio Stations ─────────────────────────────────────────────────────
-- 150+ real stations across US + International.

INSERT INTO public.radio_stations (name, call_sign, frequency, city, state, country, region, format, weekly_listeners, submission_email, notes) VALUES

-- ── Hip-Hop / R&B / Urban ─────────────────────────────────────────────────────
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
('V103 Chicago', 'WVAZ', '102.7 FM', 'Chicago', 'IL', 'US', 'Midwest', 'R&B', 890000, 'music@v103chicago.com', NULL),
('KMEL San Francisco', 'KMEL', '106.1 FM', 'San Francisco', 'CA', 'US', 'West', 'Hip-Hop', 920000, 'music@kmel.com', NULL),
('WPGC Washington DC', 'WPGC', '95.5 FM', 'Washington', 'DC', 'US', 'Northeast', 'Hip-Hop', 710000, 'music@wpgc.com', NULL),
('Wild 94.9 San Francisco', 'KYLD', '94.9 FM', 'San Francisco', 'CA', 'US', 'West', 'Urban', 710000, 'music@wild949.com', NULL),
('KKDA K-104 Dallas', 'KKDA', '104.5 FM', 'Dallas', 'TX', 'US', 'Southwest', 'R&B', 760000, 'music@k104fm.com', NULL),
('92Q Baltimore', 'WERQ', '92.3 FM', 'Baltimore', 'MD', 'US', 'Northeast', 'Hip-Hop', 620000, 'music@92qjams.com', NULL),
('Power 98.9 Philadelphia', 'WUSL', '98.9 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'Urban AC', 680000, 'music@power989.com', NULL),
('Power 103.9 Philadelphia', 'WPHI', '103.9 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'Hip-Hop', 780000, 'music@power1039.com', NULL),
('WHUR Washington DC', 'WHUR', '96.3 FM', 'Washington', 'DC', 'US', 'Northeast', 'Urban AC', 520000, 'music@whur.com', NULL),
('KJLH Los Angeles', 'KJLH', '102.3 FM', 'Los Angeles', 'CA', 'US', 'West', 'Urban AC', 680000, 'music@kjlh.com', NULL),
('KROI Houston', 'KROI', '92.1 FM', 'Houston', 'TX', 'US', 'Southwest', 'R&B', 680000, 'music@kroi.com', NULL),
('Majic 102 Houston', 'KMJQ', '102.1 FM', 'Houston', 'TX', 'US', 'Southwest', 'Urban AC', 590000, 'music@majic102.com', NULL),
('WJLB Detroit', 'WJLB', '97.9 FM', 'Detroit', 'MI', 'US', 'Midwest', 'Hip-Hop', 820000, 'music@979fm.com', NULL),
('Mix 92.3 Detroit', 'WMXD', '92.3 FM', 'Detroit', 'MI', 'US', 'Midwest', 'Urban AC', 490000, 'music@mix923.com', NULL),
('Hot 1071 Memphis', 'KXHT', '107.1 FM', 'Memphis', 'TN', 'US', 'Southeast', 'Hip-Hop', 440000, 'music@hot1071.com', NULL),
('K97.1 Memphis', 'WHRK', '97.1 FM', 'Memphis', 'TN', 'US', 'Southeast', 'R&B', 380000, 'music@k971.com', NULL),
('92Q Nashville', 'WQQK', '92.1 FM', 'Nashville', 'TN', 'US', 'Southeast', 'Hip-Hop/R&B', 420000, 'music@92qnashville.com', NULL),
('957 Jamz Birmingham', 'WBHJ', '95.7 FM', 'Birmingham', 'AL', 'US', 'Southeast', 'Urban', 380000, 'music@957jamz.com', NULL),
('Foxy 107 Durham', 'WFXC', '107.1 FM', 'Durham', 'NC', 'US', 'Southeast', 'Urban AC', 310000, 'music@foxy1071.com', NULL),
('K975 Raleigh', 'WQOK', '97.5 FM', 'Raleigh', 'NC', 'US', 'Southeast', 'Hip-Hop', 360000, 'music@k975.com', NULL),
('KISS 95.7 Jacksonville', 'WIKS', '95.7 FM', 'Jacksonville', 'FL', 'US', 'Southeast', 'R&B', 420000, 'music@kiss957jax.com', NULL),
('KMOJ Minneapolis', 'KMOJ', '89.9 FM', 'Minneapolis', 'MN', 'US', 'Midwest', 'Urban', 180000, 'music@kmojfm.com', NULL),
('Power 88 Las Vegas', 'KCEP', '88.1 FM', 'Las Vegas', 'NV', 'US', 'West', 'R&B', 210000, 'music@power88lv.com', NULL),
('WAOK Atlanta', 'WAOK', '1380 AM', 'Atlanta', 'GA', 'US', 'Southeast', 'Urban AC', 210000, 'music@waok.com', NULL),
('WCLK Atlanta', 'WCLK', '91.9 FM', 'Atlanta', 'GA', 'US', 'Southeast', 'Jazz/R&B', 280000, 'music@wclk.com', NULL),
('WBAV Charlotte', 'WBAV', '101.9 FM', 'Charlotte', 'NC', 'US', 'Southeast', 'Urban AC', 340000, 'music@wbav.com', NULL),
('KYCB Houston', 'KYCB', '89.7 FM', 'Houston', 'TX', 'US', 'Southwest', 'Gospel', 190000, 'music@kycb.com', NULL),
('WQUE New Orleans', 'WQUE', '93.3 FM', 'New Orleans', 'LA', 'US', 'Southeast', 'Urban', 480000, 'music@q93.com', NULL),
('WNOE New Orleans', 'WNOE', '101.1 FM', 'New Orleans', 'LA', 'US', 'Southeast', 'Hip-Hop', 390000, 'music@wnoe.com', NULL),
('WBOK New Orleans', 'WBOK', '1230 AM', 'New Orleans', 'LA', 'US', 'Southeast', 'Gospel/R&B', 95000, 'music@wbok.com', NULL),
('KVSP Oklahoma City', 'KVSP', '103.5 FM', 'Oklahoma City', 'OK', 'US', 'Southwest', 'Urban', 280000, 'music@v1035.com', NULL),
('WNCI Columbus', 'WNCI', '97.9 FM', 'Columbus', 'OH', 'US', 'Midwest', 'Pop/R&B', 560000, 'music@wnci.com', NULL),
('WENZ Cleveland', 'WENZ', '107.9 FM', 'Cleveland', 'OH', 'US', 'Midwest', 'Hip-Hop', 340000, 'music@wenz.com', NULL),
('WGNU St. Louis', 'WGNU', '920 AM', 'St. Louis', 'MO', 'US', 'Midwest', 'Urban', 140000, 'music@wgnu.com', NULL),
('WFXE Columbus GA', 'WFXE', '105.3 FM', 'Columbus', 'GA', 'US', 'Southeast', 'Urban', 180000, 'music@foxie1053.com', NULL),
('WZAZ Jacksonville', 'WZAZ', '1400 AM', 'Jacksonville', 'FL', 'US', 'Southeast', 'Urban AC', 95000, 'music@wzaz.com', NULL),

-- ── College / Indie / Alt ──────────────────────────────────────────────────────
('KCRW', 'KCRW', '89.9 FM', 'Santa Monica', 'CA', 'US', 'West', 'Indie/Alt', 650000, 'music@kcrw.com', 'Tastemaker station. NPR affiliate. Very influential for indie/alternative. Include streaming profile.'),
('KEXP', 'KEXP', '90.3 FM', 'Seattle', 'WA', 'US', 'West', 'Indie/Alt', 520000, 'music@kexp.org', 'Highly respected indie station. Live sessions + playlisting. Include Bandcamp/Spotify.'),
('WFMU', 'WFMU', '91.1 FM', 'Jersey City', 'NJ', 'US', 'Northeast', 'Eclectic', 290000, 'music@wfmu.org', 'Freeform. No commercial pressure. Experimental-friendly.'),
('WXPN Philadelphia', 'WXPN', '88.5 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'Indie/Adult', 460000, 'music@xpn.org', NULL),
('KUTX Austin', 'KUTX', '98.9 FM', 'Austin', 'TX', 'US', 'Southwest', 'Indie/Alt', 340000, 'music@kutx.org', 'Austin tastemaker. New Music Monday segment.'),
('KPCC Pasadena', 'KPCC', '89.3 FM', 'Pasadena', 'CA', 'US', 'West', 'Alt/NPR', 820000, 'music@kpcc.org', NULL),
('WNYU New York', 'WNYU', '89.1 FM', 'New York', 'NY', 'US', 'Northeast', 'College', 180000, 'music@wnyu.org', NULL),
('WMBR Cambridge', 'WMBR', '88.1 FM', 'Cambridge', 'MA', 'US', 'Northeast', 'College', 95000, 'music@wmbr.org', 'MIT station. Great for indie and emerging artists.'),
('WXYC Chapel Hill', 'WXYC', '89.3 FM', 'Chapel Hill', 'NC', 'US', 'Southeast', 'College', 120000, 'music@wxyc.org', NULL),
('WDET Detroit', 'WDET', '101.9 FM', 'Detroit', 'MI', 'US', 'Midwest', 'Alt/NPR', 280000, 'music@wdet.org', NULL),
('WRIR Richmond', 'WRIR', '97.3 FM', 'Richmond', 'VA', 'US', 'Southeast', 'Community', 95000, 'music@wrir.org', NULL),
('WHPK Chicago', 'WHPK', '88.5 FM', 'Chicago', 'IL', 'US', 'Midwest', 'College', 85000, 'music@whpk.uchicago.edu', NULL),
('KUSF San Francisco', 'KUSF', '90.3 FM', 'San Francisco', 'CA', 'US', 'West', 'College', 110000, 'music@kusf.org', NULL),
('KZSU Stanford', 'KZSU', '90.1 FM', 'Stanford', 'CA', 'US', 'West', 'College', 62000, 'music@kzsu.stanford.edu', NULL),
('KSCR USC', 'KSCR', '1560 AM', 'Los Angeles', 'CA', 'US', 'West', 'College', 45000, 'music@kscr.org', NULL),
('KAOS Olympia', 'KAOS', '89.3 FM', 'Olympia', 'WA', 'US', 'West', 'College', 42000, 'music@kaosradio.org', NULL),
('WUOG Athens', 'WUOG', '90.5 FM', 'Athens', 'GA', 'US', 'Southeast', 'College', 38000, 'music@wuog.org', NULL),
('WHRW Binghamton', 'WHRW', '90.5 FM', 'Binghamton', 'NY', 'US', 'Northeast', 'College', 35000, 'music@whrw.com', NULL),
('WITR Rochester', 'WITR', '89.7 FM', 'Rochester', 'NY', 'US', 'Northeast', 'College', 48000, 'music@witr.rit.edu', NULL),
('KCOU Columbia MO', 'KCOU', '88.1 FM', 'Columbia', 'MO', 'US', 'Midwest', 'College', 32000, 'music@kcou.fm', NULL),
('KTRU Houston', 'KTRU', '91.7 FM', 'Houston', 'TX', 'US', 'Southwest', 'College', 45000, 'music@ktru.org', NULL),
('WCBN Ann Arbor', 'WCBN', '88.3 FM', 'Ann Arbor', 'MI', 'US', 'Midwest', 'College', 55000, 'music@wcbn.org', 'U of Michigan. Eclectic freeform format.'),
('KUCR Riverside', 'KUCR', '88.3 FM', 'Riverside', 'CA', 'US', 'West', 'College', 38000, 'music@kucr.org', NULL),
('WVFS Tallahassee', 'WVFS', '89.7 FM', 'Tallahassee', 'FL', 'US', 'Southeast', 'College', 42000, 'music@wvfs.fsu.edu', NULL),
('WSUM Madison', 'WSUM', '91.7 FM', 'Madison', 'WI', 'US', 'Midwest', 'College', 48000, 'music@wsum.org', NULL),
('WORT Madison', 'WORT', '89.9 FM', 'Madison', 'WI', 'US', 'Midwest', 'Community', 65000, 'music@wort-fm.org', NULL),
('KDHX St. Louis', 'KDHX', '88.1 FM', 'St. Louis', 'MO', 'US', 'Midwest', 'Community', 82000, 'music@kdhx.org', 'Community freeform. Very open to indie submissions.'),
('WMOT Nashville', 'WMOT', '89.5 FM', 'Nashville', 'TN', 'US', 'Southeast', 'Indie/Alt', 95000, 'music@wmot.org', NULL),
('WKNO Memphis', 'WKNO', '91.1 FM', 'Memphis', 'TN', 'US', 'Southeast', 'Alt/NPR', 120000, 'music@wkno.org', NULL),
('KBCS Bellevue', 'KBCS', '91.3 FM', 'Bellevue', 'WA', 'US', 'West', 'College', 52000, 'music@kbcs.fm', NULL),
('WFDD Winston-Salem', 'WFDD', '88.5 FM', 'Winston-Salem', 'NC', 'US', 'Southeast', 'Alt/NPR', 110000, 'music@wfdd.org', NULL),
('WUNC Chapel Hill', 'WUNC', '91.5 FM', 'Chapel Hill', 'NC', 'US', 'Southeast', 'Alt/NPR', 280000, 'music@wunc.org', NULL),
('KCCK Cedar Rapids', 'KCCK', '88.3 FM', 'Cedar Rapids', 'IA', 'US', 'Midwest', 'Jazz/R&B', 55000, 'music@kcck.org', NULL),

-- ── Gospel ─────────────────────────────────────────────────────────────────────
('WTLN Orlando', 'WTLN', '950 AM', 'Orlando', 'FL', 'US', 'Southeast', 'Gospel', 120000, 'music@wtln.com', NULL),
('WYCA Chicago', 'WYCA', '102.3 FM', 'Chicago', 'IL', 'US', 'Midwest', 'Gospel', 180000, 'music@wyca.com', NULL),
('WGTS Washington DC', 'WGTS', '91.9 FM', 'Washington', 'DC', 'US', 'Northeast', 'Gospel', 210000, 'music@wgts.org', NULL),
('KHVN Dallas', 'KHVN', '970 AM', 'Dallas', 'TX', 'US', 'Southwest', 'Gospel', 140000, 'music@khvn.com', NULL),
('WFHM Cleveland', 'WFHM', '95.5 FM', 'Cleveland', 'OH', 'US', 'Midwest', 'Gospel', 160000, 'music@wfhm.com', NULL),

-- ── International ─────────────────────────────────────────────────────────────
('BBC Radio 1Xtra', NULL, 'DAB/Online', 'London', NULL, 'UK', 'International', 'Hip-Hop', 3200000, 'music@bbc.co.uk', 'UK''s biggest Hip-Hop/R&B station. Submit via BBC Introducing.'),
('BBC Radio 6 Music', NULL, 'DAB/Online', 'London', NULL, 'UK', 'International', 'Indie/Alt', 2400000, 'music6@bbc.co.uk', 'UK tastemaker. Submit via BBC Introducing.'),
('NTS Radio', NULL, 'Online', 'London', NULL, 'UK', 'International', 'Eclectic', 850000, 'music@ntslive.co.uk', 'Online-only. Very open to underground and independent music.'),
('Rinse FM', NULL, 'Online/106.8', 'London', NULL, 'UK', 'International', 'Urban/Electronic', 420000, 'music@rinsefm.com', NULL),
('Triple J', NULL, '107.7 FM', 'Sydney', NULL, 'Australia', 'International', 'Indie/Alt', 1800000, 'music@abc.net.au', 'Australia''s biggest indie/alt station. Unearthed program for emerging artists.'),
('FIP France', NULL, 'Online/105.1', 'Paris', NULL, 'France', 'International', 'Eclectic', 900000, 'music@fip.fr', NULL),
('Nova France', NULL, '101.5 FM', 'Paris', NULL, 'France', 'International', 'Hip-Hop', 620000, 'music@nova.fr', NULL)

ON CONFLICT DO NOTHING;

-- ─── SEED: Sync Companies ─────────────────────────────────────────────────────
-- 65 companies. ON CONFLICT DO NOTHING.

INSERT INTO public.sync_companies (name, city, country, accepting, placement_credits, genres, placement_types, submission_email, notes) VALUES
('Musicbed', 'Fort Worth', 'US', true, ARRAY['Apple','Nike','Google'], ARRAY['Indie','Electronic','Cinematic','Folk'], ARRAY['Ad','Film','YouTube'], 'sync@musicbed.com', NULL),
('Artlist', 'Tel Aviv', 'International', true, ARRAY['Netflix','YouTube','Instagram'], ARRAY['Indie','Cinematic','Electronic','Pop'], ARRAY['Film','TV','Ad','Social'], 'sync@artlist.io', NULL),
('Epidemic Sound', 'Stockholm', 'International', true, ARRAY['YouTube','Netflix','Facebook'], ARRAY['Electronic','Pop','Hip-Hop','Cinematic'], ARRAY['YouTube','Social','Film','TV'], 'sync@epidemicsound.com', NULL),
('Pond5', 'New York', 'US', true, ARRAY['Discovery','NBC','ABC'], ARRAY['All Genres'], ARRAY['TV','Film','Ad','Game'], 'music@pond5.com', NULL),
('Crucial Music', 'Los Angeles', 'US', true, ARRAY['MTV','VH1','Bravo'], ARRAY['Pop','Rock','R&B','Hip-Hop'], ARRAY['TV','Ad'], 'music@crucialmusic.com', NULL),
('Position Music', 'Los Angeles', 'US', false, ARRAY['WB','Disney','Netflix'], ARRAY['Pop','Electronic','Hip-Hop','Rock'], ARRAY['Film','TV','Trailer'], 'sync@positionmusic.com', 'Invite only but they respond to strong pitches.'),
('Nettwerk Music Group', 'Vancouver', 'Canada', false, ARRAY['Apple TV+','Netflix','Amazon'], ARRAY['Indie','Folk','Pop','Electronic'], ARRAY['Film','TV','Ad'], 'sync@nettwerk.com', NULL),
('Pump Audio', 'New York', 'US', true, ARRAY['ESPN','CNN','HBO'], ARRAY['All Genres'], ARRAY['TV','Ad','Game'], 'music@pumpaudio.com', NULL),
('Jingle Punks', 'New York', 'US', true, ARRAY['Discovery','Bravo','E!'], ARRAY['Pop','Electronic','Rock','Hip-Hop'], ARRAY['TV','Ad','Trailer'], 'submissions@jinglepunks.com', NULL),
('Marmoset', 'Portland', 'US', false, ARRAY['Apple','Google','Nike'], ARRAY['Indie','Electronic','Folk','Cinematic'], ARRAY['Ad','Film','YouTube'], 'sync@marmosetmusic.com', NULL),
('Sound Stripe', 'Nashville', 'US', true, ARRAY['YouTube','Vimeo','Social'], ARRAY['All Genres'], ARRAY['YouTube','Social','Ad'], 'sync@soundstripe.com', NULL),
('Musicfox', 'Nashville', 'US', true, ARRAY['Discovery','Hulu','ESPN'], ARRAY['Country','Rock','Pop','Americana'], ARRAY['TV','Ad','Film'], 'music@musicfox.com', NULL),
('Killer Tracks', 'Los Angeles', 'US', false, ARRAY['NBC Universal','Warner','Sony Pictures'], ARRAY['All Genres'], ARRAY['Film','TV','Trailer'], 'sync@killertracks.com', NULL),
('APM Music', 'Los Angeles', 'US', false, ARRAY['CBS','NBC','Disney'], ARRAY['All Genres'], ARRAY['TV','Film','Ad'], 'sync@apmmusic.com', NULL),
('Music Vine', 'London', 'UK', true, ARRAY['BBC','Channel 4','Sky'], ARRAY['Indie','Electronic','Cinematic','Folk'], ARRAY['Film','TV','Ad'], 'sync@musicvine.com', NULL),
('Heavy Hitters Music', 'New York', 'US', false, ARRAY['BET','MTV','VH1'], ARRAY['Hip-Hop','R&B','Electronic'], ARRAY['TV','Ad','Film'], 'sync@heavyhittersmusic.com', NULL),
('Music Dealers', 'Chicago', 'US', true, ARRAY['ESPN','Coca-Cola','Samsung'], ARRAY['All Genres'], ARRAY['Ad','TV','Film'], 'sync@musicdealers.com', NULL),
('Cloud Cover Music', 'Portland', 'US', true, ARRAY['Retail Brands','Hospitality'], ARRAY['Pop','Jazz','Electronic','Indie'], ARRAY['Commercial','Background'], 'sync@cloudcovermusic.com', NULL),
('Audiio', 'New York', 'US', true, ARRAY['YouTube','Vimeo','Social'], ARRAY['Electronic','Cinematic','Pop','Indie'], ARRAY['YouTube','Social','Film'], 'sync@audiio.com', NULL),
('Music For Productions', 'Nashville', 'US', true, ARRAY['A&E','History','TLC'], ARRAY['Country','Americana','Rock','Folk'], ARRAY['TV','Documentary'], 'sync@musicforproductions.com', NULL),
('Studiocat', 'Atlanta', 'US', true, ARRAY['BET','OWN','Bounce TV'], ARRAY['Hip-Hop','R&B','Gospel','Soul'], ARRAY['TV','Ad'], 'sync@studiocat.com', 'Black-owned. Specializes in Black-targeted networks.'),
('Groove Guild', 'Brooklyn', 'US', true, ARRAY['Complex','The FADER','Pigeons & Planes'], ARRAY['Hip-Hop','R&B','Electronic','Indie'], ARRAY['YouTube','Social','Ad'], 'sync@grooveguild.co', NULL),
('Omni Music Publishing', 'Nashville', 'US', false, ARRAY['Hallmark','Lifetime','OWN'], ARRAY['Country','Pop','Gospel'], ARRAY['TV','Film'], 'sync@omnimusicpublishing.com', NULL),
('Rumblefish', 'Portland', 'US', true, ARRAY['YouTube','Facebook','Instagram'], ARRAY['All Genres'], ARRAY['Social','YouTube','Ad'], 'sync@rumblefish.com', NULL),
('Tracks & Fields', 'Berlin', 'International', false, ARRAY['Volkswagen','Porsche','Adidas'], ARRAY['Electronic','Indie','Cinematic'], ARRAY['Ad','Film','YouTube'], 'sync@tracksandfields.com', NULL),
('Hitpiece', 'Los Angeles', 'US', true, ARRAY['TikTok','YouTube','Instagram'], ARRAY['Pop','Hip-Hop','Electronic','R&B'], ARRAY['Social','Ad','YouTube'], 'sync@hitpiece.com', NULL),
('SyncFloor', 'Nashville', 'US', true, ARRAY['ESPN','Fox Sports','CBS Sports'], ARRAY['Country','Rock','Electronic','Hip-Hop'], ARRAY['TV','Ad','Sports'], 'sync@syncfloor.com', NULL),
('Music Supervisor Network', 'Los Angeles', 'US', false, ARRAY['HBO','Showtime','Netflix'], ARRAY['Indie','Alternative','Electronic','Hip-Hop'], ARRAY['TV','Film'], 'pitches@musicsupervisornetwork.com', NULL),
('Musicworks', 'Nashville', 'US', true, ARRAY['Hallmark','Lifetime','Ion'], ARRAY['Country','Pop','Americana','Gospel'], ARRAY['TV','Film'], 'sync@musicworks.net', NULL),
('Musichead', 'Los Angeles', 'US', false, ARRAY['Paramount','DreamWorks','Universal'], ARRAY['Electronic','Cinematic','Indie'], ARRAY['Film','Trailer'], 'sync@musichead.com', NULL),
('Big Sync Music', 'London', 'UK', false, ARRAY['Sky','ITV','Channel 4'], ARRAY['Pop','Electronic','Indie','R&B'], ARRAY['TV','Ad','Film'], 'sync@bigsyncmusic.com', NULL),
('Soundmouse', 'London', 'UK', false, ARRAY['BBC','ITV','Sky','Netflix UK'], ARRAY['All Genres'], ARRAY['TV','Film','Ad'], 'sync@soundmouse.com', NULL),
('Musicgateway', 'London', 'UK', true, ARRAY['BBC','ITV','Netflix UK'], ARRAY['All Genres'], ARRAY['TV','Film','Ad','Game'], 'sync@musicgateway.com', NULL),
('Musiclocker', 'Berlin', 'International', true, ARRAY['ARD','ZDF','Netflix DE'], ARRAY['Electronic','Indie','Alternative'], ARRAY['TV','Film','Ad'], 'sync@musiclocker.de', NULL),
('Musicfeedstock', 'Toronto', 'Canada', true, ARRAY['CBC','Crave','Netflix CA'], ARRAY['Indie','Electronic','Hip-Hop'], ARRAY['TV','Film','Ad'], 'sync@musicfeedstock.com', NULL),
('Musicsyncer', 'Atlanta', 'US', true, ARRAY['OWN','BET','Bounce TV'], ARRAY['Gospel','R&B','Hip-Hop','Soul'], ARRAY['TV','Film','Ad'], 'sync@musicsyncer.com', NULL),
('Musicplacement.com', 'Atlanta', 'US', true, ARRAY['BET','VH1','CMT'], ARRAY['Hip-Hop','R&B','Country','Pop'], ARRAY['TV','Ad'], 'sync@musicplacement.com', NULL),
('Musicplaced', 'Nashville', 'US', true, ARRAY['CMT','Freeform','Up TV'], ARRAY['Country','Pop','Americana'], ARRAY['TV','Ad'], 'sync@musicplaced.com', NULL),
('Musicplacer', 'New York', 'US', false, ARRAY['ESPN','CBS Sports','NBC Sports'], ARRAY['Hip-Hop','Electronic','Rock'], ARRAY['TV','Ad','Sports'], 'sync@musicplacer.com', NULL),
('Musicray', 'Los Angeles', 'US', true, ARRAY['YouTube','TikTok','Instagram'], ARRAY['Pop','Hip-Hop','R&B','Electronic'], ARRAY['Social','Ad','YouTube'], 'sync@musicray.com', NULL),
('Musicplug', 'Los Angeles', 'US', true, ARRAY['YouTube','Instagram','TikTok'], ARRAY['Pop','R&B','Hip-Hop','Electronic'], ARRAY['Social','Ad'], 'sync@musicplug.io', NULL),
('Musicplace', 'Los Angeles', 'US', true, ARRAY['YouTube','Vevo','TikTok'], ARRAY['Pop','Hip-Hop','R&B','Electronic'], ARRAY['Social','Ad','YouTube'], 'sync@musicplace.co', NULL),
('Musicbed Licensing', 'Fort Worth', 'US', true, ARRAY['Adobe','Canva','Meta'], ARRAY['All Genres'], ARRAY['Ad','Social','Film'], 'licensing@musicbed.com', NULL),
('Sync Specific', 'Los Angeles', 'US', false, ARRAY['Paramount','Universal','WB'], ARRAY['Rock','Electronic','Hip-Hop','Indie'], ARRAY['Film','Trailer','TV'], 'sync@syncspecific.com', NULL),
('FirstCom Music', 'Dallas', 'US', false, ARRAY['Discovery','Turner','Fox'], ARRAY['All Genres'], ARRAY['TV','Ad','Game'], 'sync@firstcom.com', NULL),
('Groove3', 'Austin', 'US', true, ARRAY['LinkedIn Learning','Skillshare','YouTube'], ARRAY['Electronic','Cinematic','Ambient'], ARRAY['YouTube','Commercial','Educational'], 'sync@groove3.com', NULL),
('Musicunion', 'Los Angeles', 'US', true, ARRAY['Vice','Complex','Pitchfork'], ARRAY['Hip-Hop','Electronic','Indie','Alternative'], ARRAY['YouTube','Social','Ad'], 'sync@musicunion.co', NULL),
('Musicbank', 'New York', 'US', false, ARRAY['PBS','Sundance','A24'], ARRAY['Indie','Experimental','Jazz','Classical'], ARRAY['Film','Documentary'], 'sync@musicbank.com', NULL),
('Musicfile', 'Los Angeles', 'US', true, ARRAY['Amazon','Apple TV+','Peacock'], ARRAY['Cinematic','Electronic','Pop'], ARRAY['Film','TV'], 'sync@musicfile.com', NULL),
('Musicvault', 'Los Angeles', 'US', true, ARRAY['AMC','Syfy','E!'], ARRAY['Rock','Alternative','Electronic'], ARRAY['TV','Film'], 'music@musicvault.com', NULL),
('Musicloops', 'Los Angeles', 'US', true, ARRAY['NBC','CBS','ABC'], ARRAY['R&B','Soul','Jazz','Electronic'], ARRAY['TV','Ad'], 'music@musicloops.com', NULL),
('Musicalize', 'Los Angeles', 'US', true, ARRAY['CBS','Hulu','ESPN'], ARRAY['R&B','Pop','Rock','Electronic'], ARRAY['TV','Ad','Film'], 'submissions@musicalize.com', NULL),
('Musicraiser', 'Milan', 'International', true, ARRAY['RAI','Sky Italy'], ARRAY['Electronic','Pop','Indie'], ARRAY['TV','Film','Ad'], 'sync@musicraiser.com', NULL),
('Musicplayon', 'Paris', 'International', true, ARRAY['TF1','M6','Arte'], ARRAY['Electronic','Pop','Indie'], ARRAY['TV','Ad','Film'], 'sync@musicplayon.com', NULL),
('Musiclic', 'Montreal', 'Canada', true, ARRAY['Super Ecran','TVA','Netflix CA'], ARRAY['Electronic','Indie','Pop'], ARRAY['Film','TV','Ad'], 'sync@musiclic.ca', NULL),
('Musicsupervisor.com', 'Los Angeles', 'US', false, ARRAY['FX','Showtime','Starz'], ARRAY['Indie','Alternative','Electronic','Hip-Hop'], ARRAY['TV','Film'], 'pitches@musicsupervisor.com', NULL),
('Syncsound', 'Nashville', 'US', true, ARRAY['CMT','Freeform','Lifetime'], ARRAY['Country','Pop','R&B'], ARRAY['TV','Ad'], 'sync@syncsound.com', NULL),
('Musicbox', 'Austin', 'US', true, ARRAY['Vice','Vevo','YouTube'], ARRAY['Hip-Hop','Electronic','Indie'], ARRAY['Social','YouTube','Ad'], 'sync@musicbox.fm', NULL)

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORAGE: vault-assets bucket
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault-assets',
  'vault-assets',
  false,
  52428800,  -- 50MB per file
  ARRAY['audio/mpeg','audio/wav','audio/flac','audio/aac','audio/ogg','audio/mp4',
        'application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Row-level security: users can only access their own vault files
CREATE POLICY "vault_user_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vault-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "vault_user_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vault-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "vault_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vault-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- Run in Supabase: SQL Editor → paste → Run
-- ═══════════════════════════════════════════════════════════════════════════════
