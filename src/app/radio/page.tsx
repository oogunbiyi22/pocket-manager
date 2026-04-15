"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radio, Send, Clock, CheckCircle2, XCircle,
  Search, ExternalLink, Music, Globe, Mail,
  Mic2, Headphones, Filter,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getSupabase } from "@/lib/supabase";
import { usePocket } from "@/components/pocket-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubStatus = "not_submitted" | "submitted" | "added" | "rejected" | "played";

type StationRecord = {
  id: string;
  name: string;
  call_sign: string | null;
  frequency: string | null;
  city: string;
  state: string | null;
  country: string;
  region: string | null;
  format: string | null;
  weekly_listeners: number | null;
  submission_email: string | null;
  submission_url: string | null;
  is_online_only: boolean;
  notes: string | null;
};

type StationState = {
  subStatus: SubStatus;
  subDate?: string;
  songsSubmitted: string[];
};

type StateMap = Record<string, StationState>;

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "pocket-radio-v2";

function loadState(): StateMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function saveState(map: StateMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// ─── Status config ─────────────────────────────────────────────────────────────

const SUB_CONFIG: Record<SubStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  not_submitted: { label: "Not Submitted", color: "text-white/35",   bg: "bg-white/5",        icon: <Send size={11} /> },
  submitted:     { label: "Submitted",     color: "text-[#ef9f27]",  bg: "bg-[#ef9f27]/10",   icon: <Clock size={11} /> },
  added:         { label: "In Rotation",   color: "text-[#97c459]",  bg: "bg-[#97c459]/10",   icon: <CheckCircle2 size={11} /> },
  played:        { label: "Played On Air", color: "text-blue-400",   bg: "bg-blue-400/10",    icon: <Mic2 size={11} /> },
  rejected:      { label: "Passed",        color: "text-red-400",    bg: "bg-red-400/10",     icon: <XCircle size={11} /> },
};

const REGIONS = ["All", "Northeast", "Southeast", "Midwest", "Southwest", "West", "International"];
const FORMATS = ["All", "Hip-Hop", "R&B", "Urban AC", "Urban", "Pop/R&B", "Indie/Alt", "College", "Jazz/R&B", "Gospel", "Eclectic", "Community", "Alt/NPR"];

// ─── Submit Modal ─────────────────────────────────────────────────────────────

function SubmitModal({ station, catalogSongs, onClose, onSubmit }: {
  station: StationRecord;
  catalogSongs: string[];
  onClose: () => void;
  onSubmit: (id: string, song: string) => void;
}) {
  const [song, setSong] = useState(catalogSongs[0] ?? "");

  const template = `Hi,

I'm an independent artist making ${station.format ?? "original"} music. I'd love to submit my track for consideration on ${station.name}.

Track: "${song || "[TRACK NAME]"}"
Genre: [GENRE]
BPM: [BPM]
Mood: [MOOD]

Streaming: [SPOTIFY/SOUNDCLOUD LINK]
EPK: [YOUR EPK LINK]

Looking forward to hearing your thoughts.

Best,
[YOUR NAME]`;

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
              <h2 className="font-bold text-white">Submit to {station.name}</h2>
              <p className="mt-0.5 text-xs text-white/35">{station.submission_email}</p>
            </div>
            <button onClick={onClose} className="text-sm text-white/35 transition hover:text-white">Cancel</button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">Song to Submit</label>
            {catalogSongs.length > 0 ? (
              <select
                value={song}
                onChange={e => setSong(e.target.value)}
                className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30 bg-white/5"
              >
                {catalogSongs.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="">Custom…</option>
              </select>
            ) : (
              <input
                value={song}
                onChange={e => setSong(e.target.value)}
                placeholder="Track name"
                className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30 bg-white/5"
              />
            )}
            {!song && catalogSongs.length > 0 && (
              <input
                placeholder="Custom track name"
                onChange={e => setSong(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30 bg-white/5"
              />
            )}
          </div>

          {station.notes && (
            <div className="rounded-xl border border-[#ef9f27]/20 p-3" style={{ background: "rgba(239,159,39,0.05)" }}>
              <div className="mb-1 text-xs font-medium text-[#ef9f27]">Station Notes</div>
              <p className="text-xs leading-relaxed text-white/45">{station.notes}</p>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Email Template</div>
            <textarea
              defaultValue={template}
              rows={9}
              className="w-full resize-none rounded-xl border border-white/10 px-3 py-3 text-xs leading-relaxed text-white/65 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)", fontFamily: "monospace" }}
            />
          </div>

          <div className="flex gap-3">
            <a
              href={`mailto:${station.submission_email}?subject=Music Submission — ${song || "New Track"}&body=${encodeURIComponent(template)}`}
              onClick={() => onSubmit(station.id, song)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 bg-[#97c459]"
            >
              <Mail size={14} />
              Open in Mail
            </a>
            <button
              onClick={() => { onSubmit(station.id, song); onClose(); }}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 transition hover:border-white/30 hover:text-white"
            >
              Mark Sent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Station Card ──────────────────────────────────────────────────────────────

function StationCard({ station, state, catalogSongs, onSubmitClick, onStatusChange }: {
  station: StationRecord;
  state: StationState;
  catalogSongs: string[];
  onSubmitClick: (s: StationRecord) => void;
  onStatusChange: (id: string, status: SubStatus) => void;
}) {
  const cfg = SUB_CONFIG[state.subStatus];
  const [expanded, setExpanded] = useState(false);
  const formats = station.format ? station.format.split("/").map(f => f.trim()) : [];

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 transition hover:border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{station.name}</span>
              {station.call_sign && <span className="text-xs text-white/25">{station.call_sign}</span>}
              {station.frequency && <span className="text-xs text-white/25">{station.frequency}</span>}
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cfg.color} ${cfg.bg}`}>
                {cfg.icon}{cfg.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-white/30">
                <Globe size={10} />
                {station.city}{station.state ? `, ${station.state}` : ""}{station.country !== "US" ? `, ${station.country}` : ""}
              </span>
              {station.weekly_listeners && (
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Headphones size={10} />
                  {station.weekly_listeners >= 1000000
                    ? `${(station.weekly_listeners / 1000000).toFixed(1)}M`
                    : `${Math.round(station.weekly_listeners / 1000)}K`} weekly
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Format tags */}
        {formats.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {formats.map(f => (
              <span key={f} className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/35">{f}</span>
            ))}
          </div>
        )}

        {/* Songs submitted */}
        {state.songsSubmitted.length > 0 && (
          <div className="mb-3 flex items-center gap-1.5">
            <Music size={11} className="text-white/25" />
            <span className="text-xs text-white/30">Submitted: {state.songsSubmitted.join(", ")}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSubmitClick(station)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80 ${
              state.subStatus === "not_submitted"
                ? "bg-[#97c459] text-[#0d0d0b]"
                : "bg-white/8 text-white"
            }`}
          >
            <Send size={11} />
            {state.subStatus === "not_submitted" ? "Submit" : "Re-submit"}
          </button>
          {station.submission_url && (
            <a
              href={station.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white"
            >
              <ExternalLink size={11} />Visit
            </a>
          )}
          {station.submission_email && (
            <a
              href={`mailto:${station.submission_email}`}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white"
            >
              <Mail size={11} />
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
            {(Object.keys(SUB_CONFIG) as SubStatus[]).map(s => {
              const c = SUB_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(station.id, s)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                    state.subStatus === s
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

export default function RadioPage() {
  const { songs } = usePocket();
  const catalogSongs = songs.map(s => s.title);

  const [stations, setStations] = useState<StationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateMap, setStateMap] = useState<StateMap>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "submitted" | "wins">("all");
  const [region, setRegion] = useState("All");
  const [format, setFormat] = useState("All");
  const [submitting, setSubmitting] = useState<StationRecord | null>(null);

  useEffect(() => {
    setStateMap(loadState());
    async function load() {
      const sb = getSupabase();
      if (!sb) { setLoading(false); return; }
      const { data } = await sb
        .from("radio_stations")
        .select("*")
        .order("weekly_listeners", { ascending: false });
      setStations((data as StationRecord[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const getState = (id: string): StationState =>
    stateMap[id] ?? { subStatus: "not_submitted", songsSubmitted: [] };

  const filtered = useMemo(() => {
    return stations.filter(s => {
      const q = search.toLowerCase();
      const state = getState(s.id);
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.call_sign ?? "").toLowerCase().includes(q) ||
        (s.format ?? "").toLowerCase().includes(q);
      const matchRegion = region === "All" || s.region === region;
      const matchFormat = format === "All" || (s.format ?? "").includes(format);
      const matchTab =
        tab === "all" ||
        (tab === "submitted" && state.subStatus !== "not_submitted") ||
        (tab === "wins" && (state.subStatus === "added" || state.subStatus === "played"));
      return matchSearch && matchRegion && matchFormat && matchTab;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, search, region, format, tab, stateMap]);

  function handleSubmit(id: string, song: string) {
    const prev = getState(id);
    const next: StateMap = {
      ...stateMap,
      [id]: {
        subStatus: "submitted",
        subDate: new Date().toISOString(),
        songsSubmitted: [...new Set([...prev.songsSubmitted, song].filter(Boolean))],
      },
    };
    setStateMap(next);
    saveState(next);
    setSubmitting(null);
  }

  function handleStatusChange(id: string, status: SubStatus) {
    const next: StateMap = {
      ...stateMap,
      [id]: { ...getState(id), subStatus: status },
    };
    setStateMap(next);
    saveState(next);
  }

  const submittedCount = stations.filter(s => getState(s.id).subStatus !== "not_submitted").length;
  const winsCount = stations.filter(s => {
    const st = getState(s.id).subStatus;
    return st === "added" || st === "played";
  }).length;

  return (
    <AppShell title="Radio Directory" eyebrow="Signal">
      <main className="mx-auto max-w-2xl">

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Stations",             value: loading ? "—" : stations.length },
            { label: "Submitted",            value: submittedCount },
            { label: "In Rotation / Played", value: winsCount },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="text-xl font-bold text-white">{s.value}</div>
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
              placeholder="Station, city, call sign, genre…"
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
            <select value={format} onChange={e => setFormat(e.target.value)}
              className="appearance-none cursor-pointer rounded-xl border border-white/10 py-2 pl-8 pr-4 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              {FORMATS.map(f => <option key={f} value={f}>{f === "All" ? "Format" : f}</option>)}
            </select>
            <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl border border-white/5 p-1" style={{ background: "rgba(255,255,255,0.03)" }}>
          {([
            { key: "all",       label: `All (${stations.length})` },
            { key: "submitted", label: `Submitted (${submittedCount})` },
            { key: "wins",      label: `Wins (${winsCount})` },
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
          <div className="py-20 text-center text-sm text-white/30">Loading stations…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-white/30" style={{ background: "rgba(255,255,255,0.02)" }}>
            {stations.length === 0 ? "Run migration 002_directories.sql to load the radio database." : "No stations match."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => (
              <StationCard
                key={s.id}
                station={s}
                state={getState(s.id)}
                catalogSongs={catalogSongs}
                onSubmitClick={setSubmitting}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {submitting && (
        <SubmitModal
          station={submitting}
          catalogSongs={catalogSongs}
          onClose={() => setSubmitting(null)}
          onSubmit={handleSubmit}
        />
      )}
    </AppShell>
  );
}
