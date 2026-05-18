/**
 * Radio Stations API
 *
 * Returns stations from Supabase if configured, otherwise serves a curated
 * static list of independent-music-friendly stations with real submission info.
 *
 * GET /api/v1/radio-stations?format=Hip-Hop&region=Northeast&q=keyword
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-server";

const STATIC_STATIONS = [
  // Hip-Hop / R&B / Urban
  { id: "s1", name: "KDAY 93.5 FM", call_sign: "KDAY", frequency: "93.5 FM", city: "Los Angeles", state: "CA", country: "US", region: "West", format: "Hip-Hop", weekly_listeners: 800000, submission_email: "music@kday.com", submission_url: "https://kday.com/submit", is_online_only: false, notes: "LA's classic Hip-Hop station. Accepts independent submissions." },
  { id: "s2", name: "WQHT Hot 97", call_sign: "WQHT", frequency: "97.1 FM", city: "New York", state: "NY", country: "US", region: "Northeast", format: "Hip-Hop", weekly_listeners: 2100000, submission_email: "music@hot97.com", submission_url: "https://hot97.com/contact", is_online_only: false, notes: "NYC Hip-Hop flagship. Focus on NY-area artists and national acts." },
  { id: "s3", name: "Power 105.1", call_sign: "WWPR", frequency: "105.1 FM", city: "New York", state: "NY", country: "US", region: "Northeast", format: "Hip-Hop", weekly_listeners: 1800000, submission_email: null, submission_url: "https://power1051fm.com/contact", is_online_only: false, notes: "NYC Hip-Hop and R&B. Strong playlist rotation for independent artists with buzz." },
  { id: "s4", name: "WPGC 95.5", call_sign: "WPGC", frequency: "95.5 FM", city: "Washington", state: "DC", country: "US", region: "Southeast", format: "Urban", weekly_listeners: 950000, submission_email: "music@wpgc.com", submission_url: null, is_online_only: false, notes: "DC's Hip-Hop and R&B. Key market for East Coast artists." },
  { id: "s5", name: "WVEE V-103", call_sign: "WVEE", frequency: "103.3 FM", city: "Atlanta", state: "GA", country: "US", region: "Southeast", format: "Urban", weekly_listeners: 1100000, submission_email: "music@v103.com", submission_url: "https://v103.com", is_online_only: false, notes: "Atlanta's Urban station. Essential for Southern market penetration." },
  { id: "s6", name: "KUBE 93.3", call_sign: "KUBE", frequency: "93.3 FM", city: "Seattle", state: "WA", country: "US", region: "West", format: "Hip-Hop", weekly_listeners: 720000, submission_email: "music@kube93.com", submission_url: null, is_online_only: false, notes: "Pacific Northwest Hip-Hop. Accepts indie submissions via email." },
  { id: "s7", name: "WBLK 93.7", call_sign: "WBLK", frequency: "93.7 FM", city: "Buffalo", state: "NY", country: "US", region: "Northeast", format: "Urban", weekly_listeners: 420000, submission_email: "music@wblk.com", submission_url: null, is_online_only: false, notes: "Western NY Urban station. Active in regional Hip-Hop community." },
  { id: "s8", name: "KMEL 106.1", call_sign: "KMEL", frequency: "106.1 FM", city: "San Francisco", state: "CA", country: "US", region: "West", format: "Urban", weekly_listeners: 870000, submission_email: "music@kmel.com", submission_url: "https://kmel.com", is_online_only: false, notes: "Bay Area Urban. Known for breaking Bay-area artists." },

  // R&B / Soul
  { id: "s9", name: "WBLS 107.5", call_sign: "WBLS", frequency: "107.5 FM", city: "New York", state: "NY", country: "US", region: "Northeast", format: "R&B", weekly_listeners: 1200000, submission_email: "music@wbls.com", submission_url: null, is_online_only: false, notes: "NYC's R&B heritage station. Strong playlist curation." },
  { id: "s10", name: "KMJQ 102.1 Majic", call_sign: "KMJQ", frequency: "102.1 FM", city: "Houston", state: "TX", country: "US", region: "Southwest", format: "R&B", weekly_listeners: 780000, submission_email: "music@majichouston.com", submission_url: null, is_online_only: false, notes: "Houston R&B. Gateway to the Texas market." },
  { id: "s11", name: "WGCI 107.5", call_sign: "WGCI", frequency: "107.5 FM", city: "Chicago", state: "IL", country: "US", region: "Midwest", format: "Urban", weekly_listeners: 1050000, submission_email: "music@wgci.com", submission_url: null, is_online_only: false, notes: "Chicago's Urban flagship. Essential for Midwest penetration." },

  // Indie / Alt / Eclectic
  { id: "s12", name: "KEXP 90.3", call_sign: "KEXP", frequency: "90.3 FM", city: "Seattle", state: "WA", country: "US", region: "West", format: "Indie/Alt", weekly_listeners: 320000, submission_email: "music@kexp.org", submission_url: "https://kexp.org/submit", is_online_only: false, notes: "Known globally for breaking independent artists. Must submit via their form. Very artist-friendly." },
  { id: "s13", name: "WXPN 88.5", call_sign: "WXPN", frequency: "88.5 FM", city: "Philadelphia", state: "PA", country: "US", region: "Northeast", format: "Indie/Alt", weekly_listeners: 290000, submission_email: "music@xpn.org", submission_url: "https://xpn.org/submit-music", is_online_only: false, notes: "NPR affiliate known for independent music. Very receptive to indie submissions." },
  { id: "s14", name: "WFMU 91.1", call_sign: "WFMU", frequency: "91.1 FM", city: "Jersey City", state: "NJ", country: "US", region: "Northeast", format: "Eclectic", weekly_listeners: 180000, submission_email: "music@wfmu.org", submission_url: "https://wfmu.org", is_online_only: false, notes: "Legendary freeform radio. No format restrictions. Genuinely open to anything." },
  { id: "s15", name: "WERS 88.9", call_sign: "WERS", frequency: "88.9 FM", city: "Boston", state: "MA", country: "US", region: "Northeast", format: "Indie/Alt", weekly_listeners: 210000, submission_email: "music@wers.org", submission_url: null, is_online_only: false, notes: "Emerson College radio. Strong independent artist support." },
  { id: "s16", name: "Radio Milwaukee", call_sign: "WYMS", frequency: "88.9 FM", city: "Milwaukee", state: "WI", country: "US", region: "Midwest", format: "Eclectic", weekly_listeners: 95000, submission_email: "music@radiomilwaukee.org", submission_url: "https://radiomilwaukee.org/submit", is_online_only: false, notes: "City-owned, artist-friendly. Submit via their portal. Accepts indie submissions across genres." },
  { id: "s17", name: "WQCS 88.9", call_sign: "WQCS", frequency: "88.9 FM", city: "Fort Pierce", state: "FL", country: "US", region: "Southeast", format: "Eclectic", weekly_listeners: 85000, submission_email: "music@wqcs.org", submission_url: null, is_online_only: false, notes: "Florida NPR affiliate. Accepts independent submissions via email." },

  // Online / Streaming
  { id: "s18", name: "NTS Radio", call_sign: null, frequency: null, city: "London", state: null, country: "UK", region: "International", format: "Eclectic", weekly_listeners: 2500000, submission_email: "music@nts.live", submission_url: "https://nts.live/submit", is_online_only: true, notes: "Global online station, massive reach. Highly respected for breaking independent artists across all genres including Afrobeats, R&B, electronic." },
  { id: "s19", name: "Rinse FM", call_sign: null, frequency: null, city: "London", state: null, country: "UK", region: "International", format: "Urban", weekly_listeners: 1200000, submission_email: "music@rinse.fm", submission_url: "https://rinse.fm", is_online_only: true, notes: "UK urban/electronic. Influential for R&B, grime, Afrobeats. Global online audience." },
  { id: "s20", name: "BBC Radio 1Xtra", call_sign: null, frequency: null, city: "London", state: null, country: "UK", region: "International", format: "Urban", weekly_listeners: 4800000, submission_email: "1xtra.music@bbc.co.uk", submission_url: "https://bbc.co.uk/music/submit", is_online_only: true, notes: "BBC's Black music station. Massive for R&B, Hip-Hop, Afrobeats. Submit via BBC Music Introducing for best shot." },
  { id: "s21", name: "BBC Music Introducing", call_sign: null, frequency: null, city: "London", state: null, country: "UK", region: "International", format: "Indie/Alt", weekly_listeners: 6000000, submission_email: null, submission_url: "https://bbc.co.uk/music/introducing", is_online_only: true, notes: "The single best free submission platform in the UK. Upload your track and it goes to every BBC local station + national shows." },
  { id: "s22", name: "Audiomack Radio", call_sign: null, frequency: null, city: "New York", state: "NY", country: "US", region: "International", format: "Hip-Hop", weekly_listeners: 8000000, submission_email: null, submission_url: "https://audiomack.com/upload", is_online_only: true, notes: "Major Afrobeats, Hip-Hop, and R&B platform. Free uploads drive massive discovery. Essential for African market." },
  { id: "s23", name: "Cool FM Nigeria", call_sign: null, frequency: null, city: "Lagos", state: null, country: "NG", region: "International", format: "Urban", weekly_listeners: 3200000, submission_email: "music@coolfm.ng", submission_url: "https://coolfm.ng/music", is_online_only: false, notes: "Nigeria's #1 commercial station. Key for Afrobeats/Afropop artists targeting West Africa." },
  { id: "s24", name: "Beat FM Nigeria", call_sign: null, frequency: null, city: "Lagos", state: null, country: "NG", region: "International", format: "Urban", weekly_listeners: 2800000, submission_email: "music@thebeatfm.com", submission_url: null, is_online_only: false, notes: "Nigerian Urban station. Heavy Afrobeats rotation. Strong digital presence." },
  { id: "s25", name: "Capital XTRA UK", call_sign: null, frequency: null, city: "London", state: null, country: "UK", region: "International", format: "Urban", weekly_listeners: 2200000, submission_email: "music@capitalxtra.com", submission_url: "https://capitalxtra.com/submit", is_online_only: false, notes: "UK's leading Urban station. Strong R&B and Afrobeats rotation." },

  // College Radio
  { id: "s26", name: "WNYU 89.1", call_sign: "WNYU", frequency: "89.1 FM", city: "New York", state: "NY", country: "US", region: "Northeast", format: "College", weekly_listeners: 95000, submission_email: "music.director@wnyu.org", submission_url: null, is_online_only: false, notes: "NYU student radio. Very open to independent music. Good for building NYC credibility." },
  { id: "s27", name: "WUSC 90.5", call_sign: "WUSC", frequency: "90.5 FM", city: "Columbia", state: "SC", country: "US", region: "Southeast", format: "College", weekly_listeners: 75000, submission_email: "music@wusc.sc.edu", submission_url: null, is_online_only: false, notes: "UofSC college radio. Active in college radio charting network." },
  { id: "s28", name: "WKDU 91.7", call_sign: "WKDU", frequency: "91.7 FM", city: "Philadelphia", state: "PA", country: "US", region: "Northeast", format: "College", weekly_listeners: 62000, submission_email: "musicdirector@wkdu.org", submission_url: null, is_online_only: false, notes: "Drexel University. Freeform. Strong indie/underground focus." },

  // Gospel / Jazz
  { id: "s29", name: "WCLK 91.9 Jazz", call_sign: "WCLK", frequency: "91.9 FM", city: "Atlanta", state: "GA", country: "US", region: "Southeast", format: "Jazz/R&B", weekly_listeners: 140000, submission_email: "music@wclk.com", submission_url: null, is_online_only: false, notes: "Clark Atlanta University. Jazz and R&B. Accepts local and national submissions." },
  { id: "s30", name: "WNAA 90.1", call_sign: "WNAA", frequency: "90.1 FM", city: "Greensboro", state: "NC", country: "US", region: "Southeast", format: "Gospel", weekly_listeners: 88000, submission_email: "music@wnaa.net", submission_url: null, is_online_only: false, notes: "NC A&T University. Gospel and inspirational. Accepts independent gospel submissions." },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const region = searchParams.get("region");
  const q = searchParams.get("q")?.toLowerCase();

  // Try Supabase first
  const supabase = getAdminSupabase();
  if (supabase) {
    let query = supabase.from("radio_stations").select("*").order("weekly_listeners", { ascending: false });
    if (format && format !== "All") query = query.ilike("format", `%${format}%`);
    if (region && region !== "All") query = query.eq("region", region);
    if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,format.ilike.%${q}%`);

    const { data, error } = await query.limit(200);
    if (!error && data && data.length > 0) {
      return NextResponse.json({ stations: data, source: "supabase" });
    }
  }

  // Fall back to static list
  let stations = STATIC_STATIONS;
  if (format && format !== "All") {
    stations = stations.filter((s) => s.format?.includes(format));
  }
  if (region && region !== "All") {
    stations = stations.filter((s) => s.region === region);
  }
  if (q) {
    stations = stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.format ?? "").toLowerCase().includes(q),
    );
  }

  return NextResponse.json({ stations, source: "static" });
}
