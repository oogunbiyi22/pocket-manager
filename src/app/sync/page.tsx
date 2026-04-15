"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, Mail, ExternalLink, CheckCircle2, Lock,
  Send, Clock, XCircle, Music, Star, StarOff,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getSupabase } from "@/lib/supabase";
import { usePocket } from "@/components/pocket-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type PitchStatus = "not_pitched" | "sent" | "in_review" | "placed" | "declined";

type SyncCompany = {
  id: string;
  name: string;
  city: string | null;
  country: string;
  accepting: boolean;
  placement_credits: string[];
  genres: string[];
  placement_types: string[];
  submission_email: string | null;
  submission_url: string | null;
  notes: string | null;
};

type SyncState = {
  pitchStatus: PitchStatus;
  pitchDate?: string;
  pitchNotes?: string;
  songTitle?: string;
  saved: boolean;
};

type StateMap = Record<string, SyncState>;

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "pocket-sync-v2";

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
  in_review:   { label: "In Review",   color: "text-blue-400",   bg: "bg-blue-400/10",    icon: <Mail size={11} /> },
  placed:      { label: "Placed",      color: "text-[#97c459]",  bg: "bg-[#97c459]/10",   icon: <CheckCircle2 size={11} /> },
  declined:    { label: "Declined",    color: "text-red-400",    bg: "bg-red-400/10",     icon: <XCircle size={11} /> },
};

const PLACEMENT_TYPES = ["All", "Film", "TV", "Ad", "Trailer", "Game", "YouTube", "Social", "Documentary", "Background"];
const ACCEPTANCE = ["All", "Accepting", "Invite Only"];

// ─── Pitch Modal ───────────────────────────────────────────────────────────────

function PitchModal({ company, catalogSongs, profile, onClose, onPitch }: {
  company: SyncCompany;
  catalogSongs: string[];
  profile: { artistName?: string };
  onClose: () => void;
  onPitch: (id: string, song: string, notes: string) => void;
}) {
  const [song, setSong] = useState(catalogSongs[0] ?? "");
  const [customSong, setCustomSong] = useState("");
  const [notes, setNotes] = useState("");
  const activeSong = song === "" ? customSong : song;

  const template = `Hi,

I'm ${profile.artistName ? profile.artistName + ", an" : "an"} independent artist and I'd like to submit my track for sync licensing consideration.

Track: "${activeSong || "[TRACK NAME]"}"
Genre: [YOUR GENRE]
BPM: [BPM]
Mood: [MOOD / VIBE]

Streaming: [SPOTIFY / SOUNDCLOUD LINK]
EPK / Press Kit: [LINK]
${company.placement_types.length > 0 ? `\nI believe this track would be a great fit for ${company.placement_types.slice(0, 2).join(" or ")} placements.` : ""}

Looking forward to hearing your thoughts.

Best,
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
              <h2 className="font-bold text-white">Pitch {company.name}</h2>
              <p className="mt-0.5 text-xs text-white/35">
                {company.accepting ? "Currently accepting submissions" : "Invite only — reach out anyway"}
              </p>
            </div>
            <button onClick={onClose} className="text-sm text-white/35 transition hover:text-white">Cancel</button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Company notes */}
          {company.notes && (
            <div className="rounded-xl border border-[#ef9f27]/20 p-3" style={{ background: "rgba(239,159,39,0.05)" }}>
              <div className="mb-1 text-xs font-medium text-[#ef9f27]">Company Notes</div>
              <p className="text-xs leading-relaxed text-white/45">{company.notes}</p>
            </div>
          )}

          {/* Placement credits context */}
          {company.placement_credits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-white/30">Known placements:</span>
              {company.placement_credits.slice(0, 5).map(c => (
                <span key={c} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">{c}</span>
              ))}
            </div>
          )}

          {/* Song picker */}
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">Song to Pitch</label>
            {catalogSongs.length > 0 ? (
              <select
                value={song}
                onChange={e => setSong(e.target.value)}
                className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30 bg-white/5"
              >
                {catalogSongs.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="">Custom…</option>
              </select>
            ) : null}
            {(song === "" || catalogSongs.length === 0) && (
              <input
                value={customSong}
                onChange={e => setCustomSong(e.target.value)}
                placeholder="Track name"
                className={`w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30 bg-white/5 ${catalogSongs.length > 0 ? "mt-2" : ""}`}
              />
            )}
          </div>

          {/* Template */}
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Pitch Template</div>
            <textarea
              defaultValue={template}
              rows={9}
              className="w-full resize-none rounded-xl border border-white/10 px-3 py-3 text-xs leading-relaxed text-white/65 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)", fontFamily: "monospace" }}
            />
          </div>

          {/* Internal notes */}
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Internal Notes</div>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Why this company, target date, follow-up plan…"
              className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>

          <div className="flex gap-3">
            {company.submission_email ? (
              <a
                href={`mailto:${company.submission_email}?subject=Sync Licensing Submission — ${activeSong || "New Track"}&body=${encodeURIComponent(template)}`}
                onClick={() => onPitch(company.id, activeSong, notes)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 bg-[#97c459]"
              >
                <Mail size={14} />
                Open in Mail
              </a>
            ) : company.submission_url ? (
              <a
                href={company.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onPitch(company.id, activeSong, notes)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 bg-[#97c459]"
              >
                <ExternalLink size={14} />
                Submit Online
              </a>
            ) : null}
            <button
              onClick={() => { onPitch(company.id, activeSong, notes); onClose(); }}
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

// ─── Company Card ──────────────────────────────────────────────────────────────

function CompanyCard({ company, state, onPitchClick, onToggleSave, onStatusChange }: {
  company: SyncCompany;
  state: SyncState;
  onPitchClick: (c: SyncCompany) => void;
  onToggleSave: (id: string) => void;
  onStatusChange: (id: string, status: PitchStatus) => void;
}) {
  const cfg = PITCH_CONFIG[state.pitchStatus];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 transition hover:border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{company.name}</span>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                company.accepting ? "bg-[#97c459]/10 text-[#97c459]" : "bg-white/5 text-white/30"
              }`}>
                {company.accepting ? <><CheckCircle2 size={9} /> Accepting</> : <><Lock size={9} /> Invite Only</>}
              </span>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cfg.color} ${cfg.bg}`}>
                {cfg.icon}{cfg.label}
              </span>
              {company.city && (
                <span className="text-xs text-white/25">{company.city}{company.country !== "US" ? `, ${company.country}` : ""}</span>
              )}
            </div>

            {/* Placement credits */}
            {company.placement_credits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {company.placement_credits.slice(0, 5).map(credit => (
                  <span key={credit} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">{credit}</span>
                ))}
              </div>
            )}

            {/* Types + genres */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {company.placement_types.slice(0, 4).map(t => (
                <span key={t} className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-white/30">{t}</span>
              ))}
              {company.genres.slice(0, 3).map(g => (
                <span key={g} className="text-[10px] text-white/20">{g}</span>
              ))}
            </div>

            {/* Pitch notes */}
            {state.pitchNotes && (
              <p className="mt-2 text-xs leading-relaxed text-[#ef9f27]/60">↳ {state.pitchNotes}</p>
            )}
            {state.songTitle && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Music size={10} className="text-white/25" />
                <span className="text-xs text-white/30">{state.songTitle}</span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              onClick={() => onToggleSave(company.id)}
              className="transition-colors"
              aria-label={state.saved ? "Unsave" : "Save"}
            >
              {state.saved
                ? <Star size={14} className="fill-[#ef9f27] text-[#ef9f27]" />
                : <StarOff size={14} className="text-white/20 hover:text-white/50" />
              }
            </button>
            <button
              onClick={() => onPitchClick(company)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80 ${
                state.pitchStatus === "not_pitched"
                  ? company.accepting ? "bg-[#97c459] text-[#0d0d0b]" : "bg-white/8 text-white"
                  : "bg-white/8 text-white"
              }`}
            >
              <Send size={10} />
              {state.pitchStatus === "not_pitched" ? "Pitch" : "Update"}
            </button>
            {company.submission_email && (
              <a
                href={`mailto:${company.submission_email}`}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white"
              >
                <Mail size={10} />
              </a>
            )}
            {company.submission_url && (
              <a
                href={company.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white"
              >
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-white/25 transition hover:text-white/50"
        >
          {expanded ? "Less" : "Update status"}
        </button>
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
                  onClick={() => onStatusChange(company.id, s)}
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

export default function SyncPage() {
  const { songs, profile, signedIn } = usePocket();
  const catalogSongs = songs.map(s => s.title);

  const [companies, setCompanies] = useState<SyncCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateMap, setStateMap] = useState<StateMap>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "saved" | "pitched">("all");
  const [placementType, setPlacementType] = useState("All");
  const [acceptance, setAcceptance] = useState("All");
  const [pitching, setPitching] = useState<SyncCompany | null>(null);

  useEffect(() => {
    setStateMap(loadState());
    async function load() {
      const sb = getSupabase();
      if (!sb) { setLoading(false); return; }
      const { data } = await sb.from("sync_companies").select("*").order("name");
      setCompanies((data as SyncCompany[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const getState = (id: string): SyncState =>
    stateMap[id] ?? { pitchStatus: "not_pitched", saved: false };

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const q = search.toLowerCase();
      const st = getState(c.id);
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        c.placement_credits.some(p => p.toLowerCase().includes(q)) ||
        c.genres.some(g => g.toLowerCase().includes(q));
      const matchType = placementType === "All" || c.placement_types.includes(placementType);
      const matchAccept = acceptance === "All" || (acceptance === "Accepting" ? c.accepting : !c.accepting);
      const matchTab =
        tab === "all" ||
        (tab === "saved" && st.saved) ||
        (tab === "pitched" && st.pitchStatus !== "not_pitched");
      return matchSearch && matchType && matchAccept && matchTab;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, search, placementType, acceptance, tab, stateMap]);

  function toggleSave(id: string) {
    const next: StateMap = { ...stateMap, [id]: { ...getState(id), saved: !getState(id).saved } };
    setStateMap(next);
    saveState(next);
  }

  async function handlePitch(id: string, songTitle: string, notes: string) {
    const next: StateMap = {
      ...stateMap,
      [id]: {
        ...getState(id),
        pitchStatus: "sent",
        pitchDate: new Date().toISOString(),
        pitchNotes: notes || undefined,
        songTitle: songTitle || undefined,
      },
    };
    setStateMap(next);
    saveState(next);
    setPitching(null);

    if (signedIn) {
      const sb = getSupabase();
      if (sb) {
        await sb.from("user_sync_pitches").upsert(
          { company_id: id, status: "pitched", song_title: songTitle, notes },
          { onConflict: "user_id,company_id" }
        );
      }
    }
  }

  function handleStatusChange(id: string, status: PitchStatus) {
    const next: StateMap = { ...stateMap, [id]: { ...getState(id), pitchStatus: status } };
    setStateMap(next);
    saveState(next);
  }

  const acceptingCount = companies.filter(c => c.accepting).length;
  const pitchedCount = companies.filter(c => getState(c.id).pitchStatus !== "not_pitched").length;
  const savedCount = companies.filter(c => getState(c.id).saved).length;
  const placedCount = companies.filter(c => getState(c.id).pitchStatus === "placed").length;

  return (
    <AppShell title="Sync Directory" eyebrow="Signal">
      <main className="mx-auto max-w-2xl">

        {/* Stats */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[
            { label: "Companies",      value: loading ? "—" : companies.length },
            { label: "Accepting",      value: loading ? "—" : acceptingCount, highlight: true },
            { label: "Pitched",        value: pitchedCount },
            { label: "Placed",         value: placedCount, green: placedCount > 0 },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className={`text-xl font-bold ${s.green ? "text-[#97c459]" : s.highlight ? "text-[#97c459]" : "text-white"}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-white/30">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Company, credits, genre…"
              className="w-full rounded-xl border border-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>
          <div className="relative">
            <select value={placementType} onChange={e => setPlacementType(e.target.value)}
              className="appearance-none cursor-pointer rounded-xl border border-white/10 py-2 pl-8 pr-4 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              {PLACEMENT_TYPES.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
            </select>
            <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          </div>
          <div className="relative">
            <select value={acceptance} onChange={e => setAcceptance(e.target.value)}
              className="appearance-none cursor-pointer rounded-xl border border-white/10 py-2 pl-8 pr-4 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              {ACCEPTANCE.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl border border-white/5 p-1" style={{ background: "rgba(255,255,255,0.03)" }}>
          {([
            { key: "all",     label: `All (${companies.length})` },
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
          <div className="py-20 text-center text-sm text-white/30">Loading companies…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-white/30" style={{ background: "rgba(255,255,255,0.02)" }}>
            {companies.length === 0 ? "Run migration FULL_MIGRATION.sql to load the sync directory." : "No companies match."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(company => (
              <CompanyCard
                key={company.id}
                company={company}
                state={getState(company.id)}
                onPitchClick={setPitching}
                onToggleSave={toggleSave}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {pitching && (
        <PitchModal
          company={pitching}
          catalogSongs={catalogSongs}
          profile={profile}
          onClose={() => setPitching(null)}
          onPitch={handlePitch}
        />
      )}
    </AppShell>
  );
}
