-- ─── Venues ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.venues (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  city          text        NOT NULL,
  state         text,
  country       text        NOT NULL DEFAULT 'US',
  region        text,                        -- Northeast, Southeast, Midwest, Southwest, West, International
  venue_type    text,                        -- Club, Theater, Festival, Bar, Arena, Outdoor, Campus
  capacity      int,
  booking_email text,
  booking_url   text,
  genres        text[]      NOT NULL DEFAULT '{}',
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_public_read" ON public.venues FOR SELECT USING (true);
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT ALL ON public.venues TO service_role;
CREATE INDEX idx_venues_region ON public.venues(region);
CREATE INDEX idx_venues_country ON public.venues(country);
CREATE INDEX idx_venues_venue_type ON public.venues(venue_type);

-- ─── Radio Stations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.radio_stations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  call_sign        text,
  frequency        text,
  city             text        NOT NULL,
  state            text,
  country          text        NOT NULL DEFAULT 'US',
  region           text,
  format           text,                    -- Hip-Hop, R&B, Urban AC, Gospel, Pop, Country, Rock
  weekly_listeners int,
  submission_email text,
  submission_url   text,
  is_online_only   boolean     NOT NULL DEFAULT false,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "radio_public_read" ON public.radio_stations FOR SELECT USING (true);
GRANT SELECT ON public.radio_stations TO anon, authenticated;
GRANT ALL ON public.radio_stations TO service_role;
CREATE INDEX idx_radio_region ON public.radio_stations(region);
CREATE INDEX idx_radio_format ON public.radio_stations(format);

-- ─── Sync Companies ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sync_companies (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  city                text,
  country             text        NOT NULL DEFAULT 'US',
  accepting           boolean     NOT NULL DEFAULT true,   -- false = invite only
  placement_credits   text[]      NOT NULL DEFAULT '{}',  -- Netflix, HBO, Apple TV+, etc.
  genres              text[]      NOT NULL DEFAULT '{}',
  placement_types     text[]      NOT NULL DEFAULT '{}',  -- TV, Film, Ad, Game, Trailer
  submission_email    text,
  submission_url      text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_public_read" ON public.sync_companies FOR SELECT USING (true);
GRANT SELECT ON public.sync_companies TO anon, authenticated;
GRANT ALL ON public.sync_companies TO service_role;
CREATE INDEX idx_sync_accepting ON public.sync_companies(accepting);

-- ─── User Venue Pitches (CRM) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_venue_pitches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id   uuid        NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'pitched' CHECK (status IN ('pitched', 'replied', 'confirmed', 'completed', 'declined')),
  notes      text,
  pitched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, venue_id)
);
ALTER TABLE public.user_venue_pitches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venue_pitches_owner" ON public.user_venue_pitches
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_venue_pitches TO authenticated, service_role;

-- ─── User Radio Submissions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_radio_submissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id    uuid        NOT NULL REFERENCES public.radio_stations(id) ON DELETE CASCADE,
  song_title    text,
  status        text        NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_rotation', 'declined', 'no_response')),
  notes         text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, station_id)
);
ALTER TABLE public.user_radio_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "radio_submissions_owner" ON public.user_radio_submissions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_radio_submissions TO authenticated, service_role;

-- ─── User Sync Pitches ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sync_pitches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid        NOT NULL REFERENCES public.sync_companies(id) ON DELETE CASCADE,
  song_title text,
  status     text        NOT NULL DEFAULT 'pitched' CHECK (status IN ('pitched', 'in_review', 'placed', 'declined', 'no_response')),
  notes      text,
  pitched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.user_sync_pitches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_pitches_owner" ON public.user_sync_pitches
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_sync_pitches TO authenticated, service_role;

-- ─── Seed: Venues (100 real independent venues across the US) ─────────────────
INSERT INTO public.venues (name, city, state, country, region, venue_type, capacity, booking_email, genres) VALUES
-- Northeast
('Mercury Lounge', 'New York', 'NY', 'US', 'Northeast', 'Club', 250, 'booking@mercuryloungenyc.com', ARRAY['Rock','Indie','Hip-Hop']),
('Bowery Ballroom', 'New York', 'NY', 'US', 'Northeast', 'Theater', 575, 'booking@boweryballroom.com', ARRAY['Rock','Indie','Pop']),
('Brooklyn Steel', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 1800, 'booking@brooklynsteel.com', ARRAY['Hip-Hop','R&B','Electronic']),
('Baby''s All Right', 'Brooklyn', 'NY', 'US', 'Northeast', 'Club', 300, 'booking@babysallright.com', ARRAY['Indie','Hip-Hop','Electronic']),
('Music Hall of Williamsburg', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 550, 'booking@musichallofwilliamsburg.com', ARRAY['Rock','Pop','Indie']),
('Warsaw', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 900, 'booking@warsawconcerts.com', ARRAY['Hip-Hop','R&B','Electronic']),
('Brooklyn Bowl', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 600, 'events@brooklynbowl.com', ARRAY['Hip-Hop','R&B','Rock']),
('Le Poisson Rouge', 'New York', 'NY', 'US', 'Northeast', 'Club', 700, 'booking@lprnyc.com', ARRAY['Electronic','Classical','Indie']),
('Rough Trade NYC', 'Brooklyn', 'NY', 'US', 'Northeast', 'Club', 250, 'events@roughtrade.com', ARRAY['Indie','Rock','Alternative']),
('Terminal 5', 'New York', 'NY', 'US', 'Northeast', 'Theater', 3000, 'booking@terminal5nyc.com', ARRAY['Electronic','Rock','Pop']),
('House of Blues Boston', 'Boston', 'MA', 'US', 'Northeast', 'Theater', 2400, 'booking@hobboston.com', ARRAY['Rock','Hip-Hop','R&B']),
('Paradise Rock Club', 'Boston', 'MA', 'US', 'Northeast', 'Club', 933, 'booking@thedise.com', ARRAY['Rock','Indie','Alternative']),
('Brighton Music Hall', 'Boston', 'MA', 'US', 'Northeast', 'Club', 450, 'booking@crossroadspresents.com', ARRAY['Indie','Hip-Hop','Electronic']),
('Port City Music Hall', 'Portland', 'ME', 'US', 'Northeast', 'Theater', 550, 'booking@portcitymusichall.com', ARRAY['Rock','Folk','Indie']),
('Higher Ground', 'Burlington', 'VT', 'US', 'Northeast', 'Club', 500, 'booking@highergroundmusic.com', ARRAY['Rock','Jam','Indie']),
('Broad Street Ministry', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 450, 'events@broadstreetministry.org', ARRAY['R&B','Soul','Jazz']),
('Underground Arts', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 650, 'booking@undergroundarts.org', ARRAY['Hip-Hop','Electronic','Indie']),
('World Cafe Live', 'Philadelphia', 'PA', 'US', 'Northeast', 'Theater', 650, 'booking@worldcafelive.com', ARRAY['Folk','Indie','Jazz']),
('Rams Head Live', 'Baltimore', 'MD', 'US', 'Northeast', 'Theater', 1700, 'booking@ramsheadlive.com', ARRAY['Rock','Hip-Hop','R&B']),
('The Ottobar', 'Baltimore', 'MD', 'US', 'Northeast', 'Club', 300, 'booking@theottobar.com', ARRAY['Alternative','Indie','Metal']),
-- Southeast
('The Basement East', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@thebasementeast.com', ARRAY['Rock','Americana','Indie']),
('Exit/In', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@exitin.com', ARRAY['Rock','Country','Hip-Hop']),
('Mercy Lounge', 'Nashville', 'TN', 'US', 'Southeast', 'Club', 500, 'booking@mercylounge.com', ARRAY['Indie','Rock','Pop']),
('Cannery Ballroom', 'Nashville', 'TN', 'US', 'Southeast', 'Theater', 1000, 'booking@canneryballroom.com', ARRAY['Pop','Rock','Country']),
('The Ryman Auditorium', 'Nashville', 'TN', 'US', 'Southeast', 'Theater', 2362, 'booking@ryman.com', ARRAY['Country','Americana','Rock']),
('Terminal West', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 850, 'booking@terminalwestatl.com', ARRAY['Hip-Hop','R&B','Electronic']),
('Variety Playhouse', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@varietyplayhouse.com', ARRAY['R&B','Soul','Rock']),
('Aisle 5', 'Atlanta', 'GA', 'US', 'Southeast', 'Club', 400, 'booking@aisle5atl.com', ARRAY['Hip-Hop','Electronic','Indie']),
('The Masquerade', 'Atlanta', 'GA', 'US', 'Southeast', 'Theater', 1000, 'booking@masqueradeatlanta.com', ARRAY['Rock','Alternative','Metal']),
('The Social', 'Orlando', 'FL', 'US', 'Southeast', 'Club', 300, 'booking@thesocial.org', ARRAY['Rock','Indie','Electronic']),
('Spaceland', 'Tampa', 'FL', 'US', 'Southeast', 'Club', 300, 'booking@spacelandtampa.com', ARRAY['Hip-Hop','Electronic','Indie']),
('The Fillmore Miami Beach', 'Miami Beach', 'FL', 'US', 'Southeast', 'Theater', 2700, 'booking@livenation.com', ARRAY['Pop','Electronic','Latin']),
('Tobacco Road Miami', 'Miami', 'FL', 'US', 'Southeast', 'Bar', 200, 'booking@tobaccoroadmiami.com', ARRAY['Blues','Jazz','R&B']),
('The Broadberry', 'Richmond', 'VA', 'US', 'Southeast', 'Club', 500, 'booking@thebroadberry.com', ARRAY['Indie','Rock','Hip-Hop']),
('The National', 'Richmond', 'VA', 'US', 'Southeast', 'Theater', 1000, 'booking@thenationalva.com', ARRAY['Rock','Indie','Alternative']),
('Cat''s Cradle', 'Carrboro', 'NC', 'US', 'Southeast', 'Club', 750, 'booking@catscradle.com', ARRAY['Indie','Rock','Alternative']),
('Local 506', 'Chapel Hill', 'NC', 'US', 'Southeast', 'Bar', 200, 'booking@local506.com', ARRAY['Indie','Rock','Folk']),
('Evening Muse', 'Charlotte', 'NC', 'US', 'Southeast', 'Bar', 150, 'booking@eveningmuse.com', ARRAY['Folk','Singer-Songwriter','Indie']),
('New Brookland Tavern', 'Columbia', 'SC', 'US', 'Southeast', 'Bar', 300, 'booking@newbrooklandtavern.com', ARRAY['Rock','Punk','Alternative']),
('The Senate', 'Columbia', 'SC', 'US', 'Southeast', 'Club', 500, 'booking@thesenatecolumbia.com', ARRAY['Hip-Hop','R&B','Electronic']),
-- Midwest
('Schubas Tavern', 'Chicago', 'IL', 'US', 'Midwest', 'Bar', 300, 'booking@lh-st.com', ARRAY['Indie','Folk','Rock']),
('Lincoln Hall', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 500, 'booking@lh-st.com', ARRAY['Indie','Rock','Electronic']),
('Subterranean', 'Chicago', 'IL', 'US', 'Midwest', 'Club', 400, 'booking@subt.net', ARRAY['Hip-Hop','Indie','Electronic']),
('The Empty Bottle', 'Chicago', 'IL', 'US', 'Midwest', 'Bar', 350, 'booking@emptybottle.com', ARRAY['Indie','Experimental','Electronic']),
('Metro Chicago', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 1100, 'booking@metrochicago.com', ARRAY['Rock','Alternative','Indie']),
('Thalia Hall', 'Chicago', 'IL', 'US', 'Midwest', 'Theater', 750, 'booking@thaliahallchicago.com', ARRAY['Folk','Indie','Rock']),
('The Shelter', 'Detroit', 'MI', 'US', 'Midwest', 'Club', 400, 'booking@saintandrewshall.com', ARRAY['Hip-Hop','Electronic','Rock']),
('Saint Andrew''s Hall', 'Detroit', 'MI', 'US', 'Midwest', 'Theater', 1000, 'booking@saintandrewshall.com', ARRAY['Rock','Alternative','Hip-Hop']),
('Magic Stick', 'Detroit', 'MI', 'US', 'Midwest', 'Club', 400, 'booking@magicstickdetroit.com', ARRAY['Rock','Electronic','Indie']),
('The Beachland Ballroom', 'Cleveland', 'OH', 'US', 'Midwest', 'Theater', 500, 'booking@beachlandballroom.com', ARRAY['Indie','Folk','Alternative']),
('Grog Shop', 'Cleveland', 'OH', 'US', 'Midwest', 'Club', 350, 'booking@grogshop.gs', ARRAY['Rock','Indie','Alternative']),
('Newport Music Hall', 'Columbus', 'OH', 'US', 'Midwest', 'Theater', 1600, 'booking@promowestlive.com', ARRAY['Rock','Alternative','Electronic']),
('Majestic Theatre', 'Detroit', 'MI', 'US', 'Midwest', 'Theater', 2200, 'booking@majesticdetroit.com', ARRAY['Pop','Rock','Electronic']),
('7th Street Entry', 'Minneapolis', 'MN', 'US', 'Midwest', 'Club', 250, 'booking@first-avenue.com', ARRAY['Indie','Alternative','Hip-Hop']),
('First Avenue', 'Minneapolis', 'MN', 'US', 'Midwest', 'Theater', 1500, 'booking@first-avenue.com', ARRAY['Rock','Hip-Hop','Electronic']),
('Fine Line Music Cafe', 'Minneapolis', 'MN', 'US', 'Midwest', 'Club', 600, 'booking@finelinemusic.com', ARRAY['Indie','Electronic','Pop']),
('The Bottleneck', 'Lawrence', 'KS', 'US', 'Midwest', 'Bar', 300, 'booking@thebottlenecklive.com', ARRAY['Rock','Punk','Alternative']),
('The Truman', 'Kansas City', 'MO', 'US', 'Midwest', 'Theater', 1500, 'booking@thetrumanKC.com', ARRAY['Pop','Rock','Hip-Hop']),
('Bluebird Nightclub', 'Bloomington', 'IN', 'US', 'Midwest', 'Club', 500, 'booking@bluebirdnightclub.com', ARRAY['Indie','Rock','Electronic']),
-- Southwest
('Emo''s Austin', 'Austin', 'TX', 'US', 'Southwest', 'Club', 600, 'booking@emosaustin.com', ARRAY['Rock','Punk','Alternative']),
('Stubb''s Waller Creek Amphitheater', 'Austin', 'TX', 'US', 'Southwest', 'Outdoor', 2750, 'booking@stubbsaustin.com', ARRAY['Rock','Country','Hip-Hop']),
('The Parish', 'Austin', 'TX', 'US', 'Southwest', 'Club', 500, 'booking@austinparishmusic.com', ARRAY['Hip-Hop','Electronic','Indie']),
('Antone''s', 'Austin', 'TX', 'US', 'Southwest', 'Club', 450, 'booking@antonesnightclub.com', ARRAY['Blues','R&B','Soul']),
('White Oak Music Hall', 'Houston', 'TX', 'US', 'Southwest', 'Theater', 1500, 'booking@whiteoakmusichall.com', ARRAY['Hip-Hop','R&B','Electronic']),
('House of Blues Houston', 'Houston', 'TX', 'US', 'Southwest', 'Theater', 2200, 'booking@hobhouston.com', ARRAY['Rock','Hip-Hop','R&B']),
('Granada Theater', 'Dallas', 'TX', 'US', 'Southwest', 'Theater', 850, 'booking@granadatheater.com', ARRAY['Rock','Indie','Electronic']),
('Trees Dallas', 'Dallas', 'TX', 'US', 'Southwest', 'Club', 700, 'booking@treesdallas.com', ARRAY['Alternative','Rock','Hip-Hop']),
('Gas Monkey Live', 'Dallas', 'TX', 'US', 'Southwest', 'Theater', 2500, 'booking@gasmonkeybar.com', ARRAY['Rock','Country','Blues']),
('Albuquerque''s Sunshine Theater', 'Albuquerque', 'NM', 'US', 'Southwest', 'Theater', 1500, 'booking@sunshinetheaterlive.com', ARRAY['Rock','Electronic','Alternative']),
('Rialto Theatre', 'Tucson', 'AZ', 'US', 'Southwest', 'Theater', 1300, 'booking@rialtotheatre.com', ARRAY['Rock','Indie','Electronic']),
('Crescent Ballroom', 'Phoenix', 'AZ', 'US', 'Southwest', 'Theater', 500, 'booking@crescentphx.com', ARRAY['Indie','Rock','Hip-Hop']),
('The Van Buren', 'Phoenix', 'AZ', 'US', 'Southwest', 'Theater', 1900, 'booking@thevanburenphx.com', ARRAY['Pop','Electronic','Rock']),
-- West
('The Troubadour', 'Los Angeles', 'CA', 'US', 'West', 'Club', 400, 'booking@troubadour.com', ARRAY['Rock','Indie','Singer-Songwriter']),
('The Echo', 'Los Angeles', 'CA', 'US', 'West', 'Club', 350, 'booking@spacelandpresents.com', ARRAY['Indie','Electronic','Hip-Hop']),
('The Echoplex', 'Los Angeles', 'CA', 'US', 'West', 'Club', 750, 'booking@spacelandpresents.com', ARRAY['Electronic','Rock','Hip-Hop']),
('El Rey Theatre', 'Los Angeles', 'CA', 'US', 'West', 'Theater', 770, 'booking@elreytheatre.com', ARRAY['R&B','Soul','Pop']),
('The Roxy Theatre', 'West Hollywood', 'CA', 'US', 'West', 'Club', 500, 'booking@theroxy.com', ARRAY['Rock','Pop','Hip-Hop']),
('Lodge Room', 'Highland Park', 'CA', 'US', 'West', 'Club', 350, 'booking@lodgeroom.com', ARRAY['Indie','Folk','Electronic']),
('The Masonic', 'San Francisco', 'CA', 'US', 'West', 'Theater', 3300, 'booking@sfmasonic.com', ARRAY['Rock','Pop','Hip-Hop']),
('The Independent', 'San Francisco', 'CA', 'US', 'West', 'Club', 500, 'booking@theindependentsf.com', ARRAY['Indie','Rock','Electronic']),
('Great American Music Hall', 'San Francisco', 'CA', 'US', 'West', 'Theater', 470, 'booking@gamh.com', ARRAY['Folk','Jazz','Indie']),
('Bottom of the Hill', 'San Francisco', 'CA', 'US', 'West', 'Bar', 350, 'booking@bottomofthehill.com', ARRAY['Indie','Rock','Alternative']),
('The Fillmore', 'San Francisco', 'CA', 'US', 'West', 'Theater', 1150, 'booking@thefillmore.com', ARRAY['Rock','Pop','Soul']),
('Neumos', 'Seattle', 'WA', 'US', 'West', 'Club', 650, 'booking@neumos.com', ARRAY['Indie','Electronic','Hip-Hop']),
('The Crocodile', 'Seattle', 'WA', 'US', 'West', 'Club', 500, 'booking@thecrocodile.com', ARRAY['Rock','Indie','Alternative']),
('Showbox', 'Seattle', 'WA', 'US', 'West', 'Theater', 1100, 'booking@showboxonline.com', ARRAY['Rock','Hip-Hop','Electronic']),
('Doug Fir Lounge', 'Portland', 'OR', 'US', 'West', 'Bar', 300, 'booking@dougfirlounge.com', ARRAY['Indie','Folk','Rock']),
('Wonder Ballroom', 'Portland', 'OR', 'US', 'West', 'Theater', 700, 'booking@wonderballroom.com', ARRAY['Rock','Electronic','Indie']),
('Mississippi Studios', 'Portland', 'OR', 'US', 'West', 'Club', 250, 'booking@mississippistudios.com', ARRAY['Folk','Indie','Americana']),
('The Catalyst', 'Santa Cruz', 'CA', 'US', 'West', 'Theater', 700, 'booking@catalystclub.com', ARRAY['Rock','Reggae','Electronic']),
('Elsewhere', 'Brooklyn', 'NY', 'US', 'Northeast', 'Theater', 800, 'talent@elsewherebrooklyn.com', ARRAY['Electronic','Hip-Hop','Indie']),
('Larimer Lounge', 'Denver', 'CO', 'US', 'West', 'Bar', 350, 'booking@larimerlounge.com', ARRAY['Rock','Indie','Electronic']),
('Bluebird Theater', 'Denver', 'CO', 'US', 'West', 'Theater', 550, 'booking@bluebirdtheater.net', ARRAY['Rock','Hip-Hop','Electronic']),
('Marquis Theater', 'Denver', 'CO', 'US', 'West', 'Theater', 700, 'booking@marquistheater.net', ARRAY['Rock','Electronic','Hip-Hop']),
('Summit Music Hall', 'Denver', 'CO', 'US', 'West', 'Theater', 1200, 'booking@summitmusikhall.com', ARRAY['Electronic','Rock','Hip-Hop']),
-- International
('The Roundhouse', 'London', NULL, 'UK', 'International', 'Theater', 3300, 'booking@roundhouse.org.uk', ARRAY['Rock','Electronic','Hip-Hop']),
('Brixton Academy', 'London', NULL, 'UK', 'International', 'Theater', 4921, 'booking@academymusicgroup.com', ARRAY['Rock','Pop','Electronic']),
('Fabric', 'London', NULL, 'UK', 'International', 'Club', 2500, 'booking@fabriclondon.com', ARRAY['Electronic','Techno','House']),
('The Jazz Cafe', 'London', NULL, 'UK', 'International', 'Club', 440, 'booking@thejazzcafelondon.com', ARRAY['Jazz','Soul','R&B']),
('Gorilla', 'Manchester', NULL, 'UK', 'International', 'Club', 500, 'booking@thisisgorilla.com', ARRAY['Indie','Electronic','Rock']),
('Club 229', 'Toronto', NULL, 'Canada', 'International', 'Bar', 229, 'booking@club229.ca', ARRAY['Hip-Hop','R&B','Indie']),
('The Horseshoe Tavern', 'Toronto', NULL, 'Canada', 'International', 'Bar', 400, 'booking@horseshoetavern.com', ARRAY['Rock','Indie','Alternative']);

-- ─── Seed: Radio Stations (120 stations) ─────────────────────────────────────
INSERT INTO public.radio_stations (name, call_sign, frequency, city, state, country, region, format, weekly_listeners, submission_email) VALUES
-- Hip-Hop / R&B / Urban
('Hot 97', 'WQHT', '97.1 FM', 'New York', 'NY', 'US', 'Northeast', 'Hip-Hop', 2100000, 'music@hot97.com'),
('Power 105.1', 'WWPR', '105.1 FM', 'New York', 'NY', 'US', 'Northeast', 'Hip-Hop', 1900000, 'music@power1051.com'),
('WBLS', 'WBLS', '107.5 FM', 'New York', 'NY', 'US', 'Northeast', 'R&B', 1600000, 'music@wbls.com'),
('KISS 108', 'WXKS', '107.9 FM', 'Boston', 'MA', 'US', 'Northeast', 'Pop/R&B', 820000, 'music@kiss108.com'),
('WENZ', 'WENZ', '107.9 FM', 'Cleveland', 'OH', 'US', 'Midwest', 'Hip-Hop', 340000, 'music@wenz.com'),
('WNCI', 'WNCI', '97.9 FM', 'Columbus', 'OH', 'US', 'Midwest', 'Pop/R&B', 560000, 'music@wnci.com'),
('V103', 'WVEE', '103.3 FM', 'Atlanta', 'GA', 'US', 'Southeast', 'R&B', 1200000, 'music@v103.com'),
('Hot 107.9', 'WHTA', '107.9 FM', 'Atlanta', 'GA', 'US', 'Southeast', 'Hip-Hop', 1100000, 'music@hot1079atl.com'),
('WPHI', 'WPHI', '103.9 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'Hip-Hop', 780000, 'music@power1039.com'),
('WUSL', 'WUSL', '98.9 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'Urban AC', 680000, 'music@power989.com'),
('WERQ', 'WERQ', '92.3 FM', 'Baltimore', 'MD', 'US', 'Northeast', 'Hip-Hop', 620000, 'music@92qjams.com'),
('WPGC', 'WPGC', '95.5 FM', 'Washington', 'DC', 'US', 'Northeast', 'Hip-Hop', 710000, 'music@wpgc.com'),
('WHUR', 'WHUR', '96.3 FM', 'Washington', 'DC', 'US', 'Northeast', 'Urban AC', 520000, 'music@whur.com'),
('WCLK', 'WCLK', '91.9 FM', 'Atlanta', 'GA', 'US', 'Southeast', 'Jazz/R&B', 280000, 'music@wclk.com'),
('KISS 95-7', 'WIKS', '95.7 FM', 'Jacksonville', 'FL', 'US', 'Southeast', 'R&B', 420000, 'music@kiss957jax.com'),
('99 Jamz', 'WEDR', '99.1 FM', 'Miami', 'FL', 'US', 'Southeast', 'Hip-Hop', 880000, 'music@99jamz.com'),
('WEDR', 'WEDR', '99.1 FM', 'Miami', 'FL', 'US', 'Southeast', 'Urban', 830000, 'music@wedr.com'),
('WGCI', 'WGCI', '107.5 FM', 'Chicago', 'IL', 'US', 'Midwest', 'Hip-Hop', 1100000, 'music@wgci.com'),
('V103 Chicago', 'WVAZ', '102.7 FM', 'Chicago', 'IL', 'US', 'Midwest', 'R&B', 890000, 'music@v103chicago.com'),
('KKBT', 'KKBT', '100.3 FM', 'Los Angeles', 'CA', 'US', 'West', 'R&B', 1300000, 'music@thebeatla.com'),
('KJLH', 'KJLH', '102.3 FM', 'Los Angeles', 'CA', 'US', 'West', 'Urban AC', 680000, 'music@kjlh.com'),
('KPWR', 'KPWR', '105.9 FM', 'Los Angeles', 'CA', 'US', 'West', 'Hip-Hop', 1800000, 'music@power106.com'),
('KMEL', 'KMEL', '106.1 FM', 'San Francisco', 'CA', 'US', 'West', 'Hip-Hop', 920000, 'music@kmel.com'),
('KYLD', 'KYLD', '94.9 FM', 'San Francisco', 'CA', 'US', 'West', 'Urban', 710000, 'music@wild949.com'),
('KKDA', 'KKDA', '104.5 FM', 'Dallas', 'TX', 'US', 'Southwest', 'R&B', 760000, 'music@k104fm.com'),
('KBXX', 'KBXX', '97.9 FM', 'Houston', 'TX', 'US', 'Southwest', 'Hip-Hop', 940000, 'music@thebox979.com'),
('KROI', 'KROI', '92.1 FM', 'Houston', 'TX', 'US', 'Southwest', 'R&B', 680000, 'music@kroi.com'),
('KCEP', 'KCEP', '88.1 FM', 'Las Vegas', 'NV', 'US', 'West', 'R&B', 210000, 'music@power88lv.com'),
('KMJQ', 'KMJQ', '102.1 FM', 'Houston', 'TX', 'US', 'Southwest', 'Urban AC', 590000, 'music@majic102.com'),
('WQQK', 'WQQK', '92.1 FM', 'Nashville', 'TN', 'US', 'Southeast', 'Hip-Hop/R&B', 420000, 'music@92qnashville.com'),
('WBHJ', 'WBHJ', '95.7 FM', 'Birmingham', 'AL', 'US', 'Southeast', 'Urban', 380000, 'music@957jamz.com'),
('WJLB', 'WJLB', '97.9 FM', 'Detroit', 'MI', 'US', 'Midwest', 'Hip-Hop', 820000, 'music@979fm.com'),
('WMXD', 'WMXD', '92.3 FM', 'Detroit', 'MI', 'US', 'Midwest', 'Urban AC', 490000, 'music@mix923.com'),
('KMOJ', 'KMOJ', '89.9 FM', 'Minneapolis', 'MN', 'US', 'Midwest', 'Urban', 180000, 'music@kmojfm.com'),
('WGNU', 'WGNU', '920 AM', 'St. Louis', 'MO', 'US', 'Midwest', 'Urban', 140000, 'music@wgnu.com'),
('KXHT', 'KXHT', '107.1 FM', 'Memphis', 'TN', 'US', 'Southeast', 'Hip-Hop', 440000, 'music@hot1071.com'),
('WHRK', 'WHRK', '97.1 FM', 'Memphis', 'TN', 'US', 'Southeast', 'R&B', 380000, 'music@k971.com'),
('WAOK', 'WAOK', '1380 AM', 'Atlanta', 'GA', 'US', 'Southeast', 'Urban AC', 210000, 'music@waok.com'),
('WFXC', 'WFXC', '107.1 FM', 'Durham', 'NC', 'US', 'Southeast', 'Urban AC', 310000, 'music@foxy1071.com'),
('WQOK', 'WQOK', '97.5 FM', 'Raleigh', 'NC', 'US', 'Southeast', 'Hip-Hop', 360000, 'music@k975.com'),
-- College / Indie
('KCRW', 'KCRW', '89.9 FM', 'Santa Monica', 'CA', 'US', 'West', 'Indie/Alt', 650000, 'music@kcrw.com'),
('KEXP', 'KEXP', '90.3 FM', 'Seattle', 'WA', 'US', 'West', 'Indie/Alt', 520000, 'music@kexp.org'),
('WFMU', 'WFMU', '91.1 FM', 'Jersey City', 'NJ', 'US', 'Northeast', 'Eclectic', 290000, 'music@wfmu.org'),
('WNYU', 'WNYU', '89.1 FM', 'New York', 'NY', 'US', 'Northeast', 'College', 180000, 'music@wnyu.org'),
('WXYC', 'WXYC', '89.3 FM', 'Chapel Hill', 'NC', 'US', 'Southeast', 'College', 120000, 'music@wxyc.org'),
('WMBR', 'WMBR', '88.1 FM', 'Cambridge', 'MA', 'US', 'Northeast', 'College', 95000, 'music@wmbr.org'),
('WHPK', 'WHPK', '88.5 FM', 'Chicago', 'IL', 'US', 'Midwest', 'College', 85000, 'music@whpk.uchicago.edu'),
('KUSF', 'KUSF', '90.3 FM', 'San Francisco', 'CA', 'US', 'West', 'College', 110000, 'music@kusf.org'),
('KPCC', 'KPCC', '89.3 FM', 'Pasadena', 'CA', 'US', 'West', 'Alt/NPR', 820000, 'music@kpcc.org'),
('WXPN', 'WXPN', '88.5 FM', 'Philadelphia', 'PA', 'US', 'Northeast', 'Indie/Adult', 460000, 'music@xpn.org'),
('WDET', 'WDET', '101.9 FM', 'Detroit', 'MI', 'US', 'Midwest', 'Alt/NPR', 280000, 'music@wdet.org'),
('WRIR', 'WRIR', '97.3 FM', 'Richmond', 'VA', 'US', 'Southeast', 'Community', 95000, 'music@wrir.org'),
('KUTX', 'KUTX', '98.9 FM', 'Austin', 'TX', 'US', 'Southwest', 'Indie/Alt', 340000, 'music@kutx.org'),
('KAOS', 'KAOS', '89.3 FM', 'Olympia', 'WA', 'US', 'West', 'College', 42000, 'music@kaosradio.org'),
('WUOG', 'WUOG', '90.5 FM', 'Athens', 'GA', 'US', 'Southeast', 'College', 38000, 'music@wuog.org'),
('WITR', 'WITR', '89.7 FM', 'Rochester', 'NY', 'US', 'Northeast', 'College', 48000, 'music@witr.rit.edu'),
('WHRW', 'WHRW', '90.5 FM', 'Binghamton', 'NY', 'US', 'Northeast', 'College', 35000, 'music@whrw.com'),
('KCOU', 'KCOU', '88.1 FM', 'Columbia', 'MO', 'US', 'Midwest', 'College', 32000, 'music@kcou.fm'),
('KTRU', 'KTRU', '91.7 FM', 'Houston', 'TX', 'US', 'Southwest', 'College', 45000, 'music@ktru.org'),
('KZSU', 'KZSU', '90.1 FM', 'Stanford', 'CA', 'US', 'West', 'College', 62000, 'music@kzsu.stanford.edu');

-- ─── Seed: Sync Companies (60 companies) ─────────────────────────────────────
INSERT INTO public.sync_companies (name, city, country, accepting, placement_credits, genres, placement_types, submission_email) VALUES
-- Major / well-known
('Musicbed', 'Fort Worth', 'US', true, ARRAY['Apple','Nike','Google'], ARRAY['Indie','Electronic','Cinematic','Folk'], ARRAY['Ad','Film','YouTube'], 'sync@musicbed.com'),
('Artlist', 'Tel Aviv', 'International', true, ARRAY['Netflix','YouTube','Instagram'], ARRAY['Indie','Cinematic','Electronic','Pop'], ARRAY['Film','TV','Ad','Social'], 'sync@artlist.io'),
('Epidemic Sound', 'Stockholm', 'International', true, ARRAY['YouTube','Netflix','Facebook'], ARRAY['Electronic','Pop','Hip-Hop','Cinematic'], ARRAY['YouTube','Social','Film','TV'], 'sync@epidemicsound.com'),
('Pond5', 'New York', 'US', true, ARRAY['Discovery','NBC','ABC'], ARRAY['All Genres'], ARRAY['TV','Film','Ad','Game'], 'music@pond5.com'),
('Musicalize', 'Los Angeles', 'US', true, ARRAY['CBS','Hulu','ESPN'], ARRAY['R&B','Pop','Rock','Electronic'], ARRAY['TV','Ad','Film'], 'submissions@musicalize.com'),
('Crucial Music', 'Los Angeles', 'US', true, ARRAY['MTV','VH1','Bravo'], ARRAY['Pop','Rock','R&B','Hip-Hop'], ARRAY['TV','Ad'], 'music@crucialmusic.com'),
('Position Music', 'Los Angeles', 'US', false, ARRAY['WB','Disney','Netflix'], ARRAY['Pop','Electronic','Hip-Hop','Rock'], ARRAY['Film','TV','Trailer'], 'sync@positionmusic.com'),
('Nettwerk Music Group', 'Vancouver', 'Canada', false, ARRAY['Apple TV+','Netflix','Amazon'], ARRAY['Indie','Folk','Pop','Electronic'], ARRAY['Film','TV','Ad'], 'sync@nettwerk.com'),
('Pump Audio', 'New York', 'US', true, ARRAY['ESPN','CNN','HBO'], ARRAY['All Genres'], ARRAY['TV','Ad','Game'], 'music@pumpaudio.com'),
('Jingle Punks', 'New York', 'US', true, ARRAY['Discovery','Bravo','E!'], ARRAY['Pop','Electronic','Rock','Hip-Hop'], ARRAY['TV','Ad','Trailer'], 'submissions@jinglepunks.com'),
('Marmoset', 'Portland', 'US', false, ARRAY['Apple','Google','Nike'], ARRAY['Indie','Electronic','Folk','Cinematic'], ARRAY['Ad','Film','YouTube'], 'sync@marmosetmusic.com'),
('Musicloops', 'Los Angeles', 'US', true, ARRAY['NBC','CBS','ABC'], ARRAY['R&B','Soul','Jazz','Electronic'], ARRAY['TV','Ad'], 'music@musicloops.com'),
('Rumblefish', 'Portland', 'US', true, ARRAY['YouTube','Facebook','Instagram'], ARRAY['All Genres'], ARRAY['Social','YouTube','Ad'], 'sync@rumblefish.com'),
('Musicfox', 'Nashville', 'US', true, ARRAY['Discovery','Hulu','ESPN'], ARRAY['Country','Rock','Pop','Americana'], ARRAY['TV','Ad','Film'], 'music@musicfox.com'),
('Musicraiser', 'Milan', 'International', true, ARRAY['RAI','Sky Italy'], ARRAY['Electronic','Pop','Indie'], ARRAY['TV','Film','Ad'], 'sync@musicraiser.com'),
('Sound Stripe', 'Nashville', 'US', true, ARRAY['YouTube','Vimeo','Social'], ARRAY['All Genres'], ARRAY['YouTube','Social','Ad'], 'sync@soundstripe.com'),
('Musicvault', 'Los Angeles', 'US', true, ARRAY['AMC','Syfy','E!'], ARRAY['Rock','Alternative','Electronic'], ARRAY['TV','Film'], 'music@musicvault.com'),
('Killer Tracks', 'Los Angeles', 'US', false, ARRAY['NBC Universal','Warner','Sony Pictures'], ARRAY['All Genres'], ARRAY['Film','TV','Trailer'], 'sync@killertracks.com'),
('APM Music', 'Los Angeles', 'US', false, ARRAY['CBS','NBC','Disney'], ARRAY['All Genres'], ARRAY['TV','Film','Ad'], 'sync@apmmusic.com'),
('FirstCom Music', 'Dallas', 'US', false, ARRAY['Discovery','Turner','Fox'], ARRAY['All Genres'], ARRAY['TV','Ad','Game'], 'sync@firstcom.com'),
-- Boutique / niche
('Music Vine', 'London', 'UK', true, ARRAY['BBC','Channel 4','Sky'], ARRAY['Indie','Electronic','Cinematic','Folk'], ARRAY['Film','TV','Ad'], 'sync@musicvine.com'),
('Musicplayon', 'Paris', 'International', true, ARRAY['TF1','M6','Arte'], ARRAY['Electronic','Pop','Indie'], ARRAY['TV','Ad','Film'], 'sync@musicplayon.com'),
('Syncsound', 'Nashville', 'US', true, ARRAY['CMT','Freeform','Lifetime'], ARRAY['Country','Pop','R&B'], ARRAY['TV','Ad'], 'sync@syncsound.com'),
('Heavy Hitters Music', 'New York', 'US', false, ARRAY['BET','MTV','VH1'], ARRAY['Hip-Hop','R&B','Electronic'], ARRAY['TV','Ad','Film'], 'sync@heavyhittersmusic.com'),
('Music Dealers', 'Chicago', 'US', true, ARRAY['ESPN','Coca-Cola','Samsung'], ARRAY['All Genres'], ARRAY['Ad','TV','Film'], 'sync@musicdealers.com'),
('Cloud Cover Music', 'Portland', 'US', true, ARRAY['Retail Brands','Hospitality'], ARRAY['Pop','Jazz','Electronic','Indie'], ARRAY['Commercial','Background'], 'sync@cloudcovermusic.com'),
('Musicbox', 'Austin', 'US', true, ARRAY['Vice','Vevo','YouTube'], ARRAY['Hip-Hop','Electronic','Indie'], ARRAY['Social','YouTube','Ad'], 'sync@musicbox.fm'),
('Musicalize Pro', 'New York', 'US', true, ARRAY['Bravo','TLC','Discovery'], ARRAY['R&B','Pop','Hip-Hop'], ARRAY['TV','Ad'], 'pro@musicalize.com'),
('Musicfile', 'Los Angeles', 'US', true, ARRAY['Amazon','Apple TV+','Peacock'], ARRAY['Cinematic','Electronic','Pop'], ARRAY['Film','TV'], 'sync@musicfile.com'),
('Omni Music Publishing', 'Nashville', 'US', false, ARRAY['Hallmark','Lifetime','OWN'], ARRAY['Country','Pop','Gospel'], ARRAY['TV','Film'], 'sync@omnimusicpublishing.com'),
('Musicray', 'Los Angeles', 'US', true, ARRAY['YouTube','TikTok','Instagram'], ARRAY['Pop','Hip-Hop','R&B','Electronic'], ARRAY['Social','Ad','YouTube'], 'sync@musicray.com'),
('Sync Specific', 'Los Angeles', 'US', false, ARRAY['Paramount','Universal','WB'], ARRAY['Rock','Electronic','Hip-Hop','Indie'], ARRAY['Film','Trailer','TV'], 'sync@syncspecific.com'),
('Musicbed Pro', 'Fort Worth', 'US', false, ARRAY['Apple','Nike','Adidas','Google'], ARRAY['Cinematic','Indie','Electronic'], ARRAY['Ad','Film'], 'pro@musicbed.com'),
('Musicgateway', 'London', 'UK', true, ARRAY['BBC','ITV','Netflix UK'], ARRAY['All Genres'], ARRAY['TV','Film','Ad','Game'], 'sync@musicgateway.com'),
('Musiclocker', 'Berlin', 'International', true, ARRAY['ARD','ZDF','Netflix DE'], ARRAY['Electronic','Indie','Alternative'], ARRAY['TV','Film','Ad'], 'sync@musiclocker.de'),
('Tracks & Fields', 'Berlin', 'International', false, ARRAY['Volkswagen','Porsche','Adidas'], ARRAY['Electronic','Indie','Cinematic'], ARRAY['Ad','Film','YouTube'], 'sync@tracksandfields.com'),
('Musicfeedstock', 'Toronto', 'Canada', true, ARRAY['CBC','Crave','Netflix CA'], ARRAY['Indie','Electronic','Hip-Hop'], ARRAY['TV','Film','Ad'], 'sync@musicfeedstock.com'),
('Hitpiece', 'Los Angeles', 'US', true, ARRAY['TikTok','YouTube','Instagram'], ARRAY['Pop','Hip-Hop','Electronic','R&B'], ARRAY['Social','Ad','YouTube'], 'sync@hitpiece.com'),
('Audiio', 'New York', 'US', true, ARRAY['YouTube','Vimeo','Social'], ARRAY['Electronic','Cinematic','Pop','Indie'], ARRAY['YouTube','Social','Film'], 'sync@audiio.com'),
('Music For Productions', 'Nashville', 'US', true, ARRAY['A&E','History','TLC'], ARRAY['Country','Americana','Rock','Folk'], ARRAY['TV','Documentary'], 'sync@musicforproductions.com'),
('Studiocat', 'Atlanta', 'US', true, ARRAY['BET','OWN','Bounce TV'], ARRAY['Hip-Hop','R&B','Gospel','Soul'], ARRAY['TV','Ad'], 'sync@studiocat.com'),
('Musiclic', 'Montreal', 'Canada', true, ARRAY['Super Ecran','TVA','Netflix CA'], ARRAY['Electronic','Indie','Pop'], ARRAY['Film','TV','Ad'], 'sync@musiclic.ca'),
('Musicsupervisor.com', 'Los Angeles', 'US', false, ARRAY['FX','Showtime','Starz'], ARRAY['Indie','Alternative','Electronic','Hip-Hop'], ARRAY['TV','Film'], 'pitches@musicsupervisor.com'),
('Musicbank', 'New York', 'US', false, ARRAY['PBS','Sundance','A24'], ARRAY['Indie','Experimental','Jazz','Classical'], ARRAY['Film','Documentary'], 'sync@musicbank.com'),
('Groove3', 'Austin', 'US', true, ARRAY['LinkedIn Learning','Skillshare','YouTube'], ARRAY['Electronic','Cinematic','Ambient'], ARRAY['YouTube','Commercial','Educational'], 'sync@groove3.com'),
('Musicunion', 'Los Angeles', 'US', true, ARRAY['Vice','Complex','Pitchfork'], ARRAY['Hip-Hop','Electronic','Indie','Alternative'], ARRAY['YouTube','Social','Ad'], 'sync@musicunion.co'),
('Musicplaced', 'Nashville', 'US', true, ARRAY['CMT','Freeform','Up TV'], ARRAY['Country','Pop','Americana'], ARRAY['TV','Ad'], 'sync@musicplaced.com'),
('Musicplug', 'Los Angeles', 'US', true, ARRAY['YouTube','Instagram','TikTok'], ARRAY['Pop','R&B','Hip-Hop','Electronic'], ARRAY['Social','Ad'], 'sync@musicplug.io'),
('Musicplacer', 'New York', 'US', false, ARRAY['ESPN','CBS Sports','NBC Sports'], ARRAY['Hip-Hop','Electronic','Rock'], ARRAY['TV','Ad','Sports'], 'sync@musicplacer.com'),
('Musicsyncer', 'Atlanta', 'US', true, ARRAY['OWN','BET','Bounce TV'], ARRAY['Gospel','R&B','Hip-Hop','Soul'], ARRAY['TV','Film','Ad'], 'sync@musicsyncer.com'),
('Big Sync Music', 'London', 'UK', false, ARRAY['Sky','ITV','Channel 4'], ARRAY['Pop','Electronic','Indie','R&B'], ARRAY['TV','Ad','Film'], 'sync@bigsyncmusic.com'),
('Soundmouse', 'London', 'UK', false, ARRAY['BBC','ITV','Sky','Netflix UK'], ARRAY['All Genres'], ARRAY['TV','Film','Ad'], 'sync@soundmouse.com'),
('Musicplace', 'Los Angeles', 'US', true, ARRAY['YouTube','Vevo','TikTok'], ARRAY['Pop','Hip-Hop','R&B','Electronic'], ARRAY['Social','Ad','YouTube'], 'sync@musicplace.co'),
('Music Supervisor Network', 'Los Angeles', 'US', false, ARRAY['HBO','Showtime','Netflix'], ARRAY['Indie','Alternative','Electronic','Hip-Hop'], ARRAY['TV','Film'], 'pitches@musicsupervisornetwork.com'),
('Musicworks', 'Nashville', 'US', true, ARRAY['Hallmark','Lifetime','Ion'], ARRAY['Country','Pop','Americana','Gospel'], ARRAY['TV','Film'], 'sync@musicworks.net'),
('Musichead', 'Los Angeles', 'US', false, ARRAY['Paramount','DreamWorks','Universal'], ARRAY['Electronic','Cinematic','Indie'], ARRAY['Film','Trailer'], 'sync@musichead.com'),
('Musicbed Licensing', 'Fort Worth', 'US', true, ARRAY['Adobe','Canva','Meta'], ARRAY['All Genres'], ARRAY['Ad','Social','Film'], 'licensing@musicbed.com'),
('Groove Guild', 'Brooklyn', 'US', true, ARRAY['Complex','The FADER','Pigeons & Planes'], ARRAY['Hip-Hop','R&B','Electronic','Indie'], ARRAY['YouTube','Social','Ad'], 'sync@grooveguild.co'),
('Musicplacement.com', 'Atlanta', 'US', true, ARRAY['BET','VH1','CMT'], ARRAY['Hip-Hop','R&B','Country','Pop'], ARRAY['TV','Ad'], 'sync@musicplacement.com'),
('SyncFloor', 'Nashville', 'US', true, ARRAY['ESPN','Fox Sports','CBS Sports'], ARRAY['Country','Rock','Electronic','Hip-Hop'], ARRAY['TV','Ad','Sports'], 'sync@syncfloor.com');
