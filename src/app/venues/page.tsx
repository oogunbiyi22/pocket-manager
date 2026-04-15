"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MapPin, Users, Globe, Mail, Search,
  Star, StarOff, Send, CheckCircle2, Clock,
  XCircle, Filter,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getSupabase } from "@/lib/supabase";
import { usePocket } from "@/components/pocket-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type PitchStatus = "not_pitched" | "sent" | "responded" | "booked" | "passed";

type VenueRecord = {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  region: string | null;
  venue_type: string | null;
  capacity: number | null;
  booking_email: string | null;
  booking_url: string | null;
  genres: string[];
  notes: string | null;
};

type VenueState = {
  pitchStatus: PitchStatus;
  pitchDate?: string;
  pitchNotes?: string;
  saved: boolean;
};

type StateMap = Record<string, VenueState>;

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "pocket-venues-v2";

function loadState(): StateMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function saveState(map: StateMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// ─── Status config ─────────────────────────────────────────────────────────────

const PITCH_CONFIG: Record<PitchStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  not_pitched: { label: "Not Pitched", color: "text-white/35",   bg: "bg-white/5",        icon: <Send size={11} /> },
  sent:        { label: "Pitch Sent",  color: "text-[#ef9f27]",  bg: "bg-[#ef9f27]/10",   icon: <Clock size={11} /> },
  responded:   { label: "Responded",   color: "text-blue-400",   bg: "bg-blue-400/10",    icon: <Mail size={11} /> },
  booked:      { label: "Booked",      color: "text-[#97c459]",  bg: "bg-[#97c459]/10",   icon: <CheckCircle2 size={11} /> },
  passed:      { label: "Passed",      color: "text-red-400",    bg: "bg-red-400/10",     icon: <XCircle size={11} /> },
};

const REGIONS = ["All", "Northeast", "Southeast", "Midwest", "Southwest", "West", "International"];
const VENUE_TYPES = ["All", "Club", "Theater", "Bar", "Outdoor", "Festival", "Campus", "Arena"];

// ─── Pitch Modal ───────────────────────────────────────────────────────────────

function PitchModal({ venue, profile, onClose, onPitch }: {
  venue: VenueRecord;
  profile: { artistName?: string };
  onClose: () => void;
  onPitch: (id: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  const template = `Hi,

I'm reaching out about booking a show at ${venue.name}. I'm ${profile.artistName ? profile.artistName + ", an" : "an"} independent artist based in [YOUR CITY] making [YOUR GENRE] music.

Spotify: [LINK]
Instagram: [LINK]
EPK: [LINK]

I'd love to discuss availability for [MONTH/YEAR]. The venue fits perfectly because ${venue.notes ? venue.notes.slice(0, 80) + "…" : "[mention why you're a fit]"}.

Happy to provide any additional info you need.

Thanks,
${profile.artistName ?? "[YOUR NAME]"}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "#111110" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">Pitch {venue.name}</h2>
              <p className="mt-0.5 text-xs text-white/35">{venue.booking_email}</p>
            </div>
            <button onClick={onClose} className="text-sm text-white/35 transition hover:text-white">Cancel</button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {venue.notes && (
            <div className="rounded-xl border border-[#ef9f27]/20 p-3" style={{ background: "rgba(239,159,39,0.05)" }}>
              <div className="mb-1 text-xs font-medium text-[#ef9f27]">Venue Notes</div>
              <p className="text-xs leading-relaxed text-white/45">{venue.notes}</p>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Pitch Template</div>
            <textarea
              defaultValue={template}
              rows={10}
              className="w-full resize-none rounded-xl border border-white/10 px-3 py-3 text-xs leading-relaxed text-white/65 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)", fontFamily: "monospace" }}
            />
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Internal Notes</div>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Target date, why this venue, follow-up reminders…"
              className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>

          <div className="flex gap-3">
            <a
              href={`mailto:${venue.booking_email}?subject=Booking Inquiry — ${profile.artistName ?? "Independent Artist"}&body=${encodeURIComponent(template)}`}
              onClick={() => onPitch(venue.id, notes)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 bg-[#97c459]"
            >
              <Mail size={14} />
              Open in Mail
            </a>
            <button
              onClick={() => { onPitch(venue.id, notes); onClose(); }}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 transition hover:border-white/30 hover:text-white"
            >
              Mark as Sent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Venue Card ────────────────────────────────────────────────────────────────

function VenueCard({ venue, state, onToggleSave, onPitchClick, onStatusChange }: {
  venue: VenueRecord;
  state: VenueState;
  onToggleSave: (id: string) => void;
  onPitchClick: (venue: VenueRecord) => void;
  onStatusChange: (id: string, status: PitchStatus) => void;
}) {
  const cfg = PITCH_CONFIG[state.pitchStatus];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 transition hover:border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{venue.name}</span>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cfg.color} ${cfg.bg}`}>
                {cfg.icon}{cfg.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-white/35">
                <MapPin size={10} />{venue.city}{venue.state ? `, ${venue.state}` : ""}{venue.country !== "US" ? `, ${venue.country}` : ""}
              </span>
              {venue.capacity && (
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Users size={10} />{venue.capacity.toLocaleString()} cap
                </span>
              )}
              {venue.venue_type && (
                <span className="text-xs text-white/25">{venue.venue_type}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => onToggleSave(venue.id)}
            className="ml-2 shrink-0 transition-colors"
            aria-label={state.saved ? "Unsave venue" : "Save venue"}
          >
            {state.saved
              ? <Star size={15} className="fill-[#ef9f27] text-[#ef9f27]" />
              : <StarOff size={15} className="text-white/20 hover:text-white/50" />
            }
          </button>
        </div>

        {/* Genres */}
        {venue.genres.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {venue.genres.slice(0, 5).map(g => (
              <span key={g} className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/35">{g}</span>
            ))}
          </div>
        )}

        {/* Venue notes */}
        {venue.notes && (
          <p className="mb-3 text-xs leading-relaxed text-white/25">{venue.notes}</p>
        )}

        {/* Pitch notes */}
        {state.pitchNotes && (
          <p className="mb-3 text-xs leading-relaxed text-[#ef9f27]/60">↳ {state.pitchNotes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPitchClick(venue)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80 ${
              state.pitchStatus === "not_pitched"
                ? "bg-[#97c459] text-[#0d0d0b]"
                : "bg-white/8 text-white"
            }`}
          >
            <Send size={11} />
            {state.pitchStatus === "not_pitched" ? "Pitch Venue" : "Update Pitch"}
          </button>
          {venue.booking_email && (
            <a
              href={`mailto:${venue.booking_email}`}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white"
            >
              <Mail size={11} />
            </a>
          )}
          {venue.booking_url && (
            <a
              href={venue.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white"
            >
              <Globe size={11} />
            </a>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-xs text-white/25 transition hover:text-white/50"
          >
            {expanded ? "Less" : "Update status"}
          </button>
        </div>
      </div>

      {/* Inline status update */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-white/30">Update Status</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PITCH_CONFIG) as PitchStatus[]).map(s => {
              const c = PITCH_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(venue.id, s)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                    state.pitchStatus === s
                      ? `${c.color} ${c.bg} border-current`
                      : "border-white/10 text-white/30 hover:border-white/30 hover:text-white/60"
                  }`}
                >
                  {c.icon}{c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function VenuesPage() {
  const { profile, signedIn } = usePocket();
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateMap, setStateMap] = useState<StateMap>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "saved" | "pitched">("all");
  const [region, setRegion] = useState("All");
  const [venueType, setVenueType] = useState("All");
  const [pitching, setPitching] = useState<VenueRecord | null>(null);

  useEffect(() => {
    setStateMap(loadState());
    async function load() {
      const sb = getSupabase();
      if (!sb) { setLoading(false); return; }
      const { data } = await sb.from("venues").select("*").order("name");
      setVenues((data as VenueRecord[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const getState = (id: string): VenueState =>
    stateMap[id] ?? { pitchStatus: "not_pitched", saved: false };

  const filtered = useMemo(() => {
    return venues.filter(v => {
      const q = search.toLowerCase();
      const st = getState(v.id);
      const matchSearch = !q ||
        v.name.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        (v.state ?? "").toLowerCase().includes(q) ||
        v.genres.some(g => g.toLowerCase().includes(q));
      const matchRegion = region === "All" || v.region === region;
      const matchType = venueType === "All" || v.venue_type === venueType;
      const matchTab =
        tab === "all" ||
        (tab === "saved" && st.saved) ||
        (tab === "pitched" && st.pitchStatus !== "not_pitched");
      return matchSearch && matchRegion && matchType && matchTab;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, search, region, venueType, tab, stateMap]);

  function toggleSave(id: string) {
    const next: StateMap = {
      ...stateMap,
      [id]: { ...getState(id), saved: !getState(id).saved },
    };
    setStateMap(next);
    saveState(next);
  }

  async function handlePitch(id: string, notes: string) {
    const next: StateMap = {
      ...stateMap,
      [id]: {
        ...getState(id),
        pitchStatus: "sent",
        pitchDate: new Date().toISOString(),
        pitchNotes: notes || undefined,
      },
    };
    setStateMap(next);
    saveState(next);
    setPitching(null);

    if (signedIn) {
      const sb = getSupabase();
      if (sb) {
        await sb.from("user_venue_pitches").upsert(
          { venue_id: id, status: "pitched", notes },
          { onConflict: "user_id,venue_id" }
        );
      }
    }
  }

  function handleStatusChange(id: string, status: PitchStatus) {
    const next: StateMap = {
      ...stateMap,
      [id]: { ...getState(id), pitchStatus: status },
    };
    setStateMap(next);
    saveState(next);
  }

  const pitchedCount = venues.filter(v => getState(v.id).pitchStatus !== "not_pitched").length;
  const savedCount   = venues.filter(v => getState(v.id).saved).length;
  const bookedCount  = venues.filter(v => getState(v.id).pitchStatus === "booked").length;

  return (
    <AppShell title="Venue Directory" eyebrow="Signal">
      <main className="mx-auto max-w-2xl">

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "In Directory", value: loading ? "—" : venues.length.toLocaleString() },
            { label: "Pitched",      value: pitchedCount },
            { label: "Booked",       value: bookedCount, highlight: bookedCount > 0 },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className={`text-xl font-bold ${s.highlight ? "text-[#97c459]" : "text-white"}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-white/30">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Venue, city, genre…"
              className="w-full rounded-xl border border-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>
          <div className="relative">
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="appearance-none cursor-pointer rounded-xl border border-white/10 py-2 pl-8 pr-4 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              {REGIONS.map(r => <option key={r} value={r}>{r === "All" ? "Region" : r}</option>)}
            </select>
            <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          </div>
          <div className="relative">
            <select value={venueType} onChange={e => setVenueType(e.target.value)}
              className="appearance-none cursor-pointer rounded-xl border border-white/10 py-2 pl-8 pr-4 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              {VENUE_TYPES.map(t => <option key={t} value={t}>{t === "All" ? "Type" : t}</option>)}
            </select>
            <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl border border-white/5 p-1" style={{ background: "rgba(255,255,255,0.03)" }}>
          {([
            { key: "all",     label: `All (${venues.length})` },
            { key: "saved",   label: `Saved (${savedCount})` },
            { key: "pitched", label: `Pitched (${pitchedCount})` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-all"
              style={{
                background: tab === t.key ? "#97c459" : "transparent",
                color: tab === t.key ? "#0d0d0b" : "rgba(255,255,255,0.35)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center text-sm text-white/30">Loading venues…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-white/30" style={{ background: "rgba(255,255,255,0.02)" }}>
            {venues.length === 0 ? "Run migration 002_directories.sql to load the venue database." : "No venues match."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(v => (
              <VenueCard
                key={v.id}
                venue={v}
                state={getState(v.id)}
                onToggleSave={toggleSave}
                onPitchClick={setPitching}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {pitching && (
        <PitchModal
          venue={pitching}
          profile={profile}
          onClose={() => setPitching(null)}
          onPitch={handlePitch}
        />
      )}
    </AppShell>
  );
}
