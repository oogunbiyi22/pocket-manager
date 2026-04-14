"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

type GuildProfile = {
  name: string;
  initials: string;
  role: string;
  genres: string[];
  vibe: string;
  open: boolean;
  fit: string;
  tone: string;
  id: string;
};

const ALL_MATCHES: GuildProfile[] = [
  { id: "nova", name: "Nova Keys", initials: "NK", role: "Producer", genres: ["Lo-fi", "Soul"], vibe: "warm drums", open: true, fit: "Open to collabs", tone: "purple" },
  { id: "remy", name: "Remy Sol", initials: "RM", role: "Songwriter", genres: ["R&B", "Neo Soul"], vibe: "hook-writing", open: true, fit: "Co-write match", tone: "green" },
  { id: "ayo", name: "Ayo J", initials: "AJ", role: "Artist", genres: ["Afrobeats", "R&B"], vibe: "feature energy", open: true, fit: "Feature match", tone: "pink" },
  { id: "lena", name: "Lena Moore", initials: "LM", role: "Vocalist", genres: ["Soul", "Gospel"], vibe: "layered harmonies", open: true, fit: "Session match", tone: "purple" },
  { id: "trq", name: "TRQ", initials: "TQ", role: "Producer", genres: ["Trap", "R&B"], vibe: "808 architect", open: false, fit: "Beat match", tone: "pink" },
  { id: "mika", name: "Mika St.", initials: "MS", role: "Songwriter", genres: ["Indie", "Pop"], vibe: "bridge specialist", open: true, fit: "Co-write match", tone: "green" },
];

const ROLES = ["All", "Producer", "Songwriter", "Artist", "Vocalist"];
const GENRES = ["All", "R&B", "Soul", "Lo-fi", "Afrobeats", "Pop", "Trap"];

function avatarClass(tone: string) {
  if (tone === "green") return "bg-[#9fe1cb] text-[#085041]";
  if (tone === "pink") return "bg-[#f4c0d1] text-[#72243e]";
  return "bg-[#cecbf6] text-[#3c3489]";
}

export default function GuildPage() {
  const { songs, profile } = usePocket();
  const activeSong = songs[0];

  const [roleFilter, setRoleFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [connected, setConnected] = useState<string[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [myRole, setMyRole] = useState(profile.role ?? "");
  const [myVibe, setMyVibe] = useState(profile.vibe ?? "");

  const filtered = useMemo(() => {
    return ALL_MATCHES.filter((m) => {
      const roleOk = roleFilter === "All" || m.role === roleFilter;
      const genreOk = genreFilter === "All" || m.genres.includes(genreFilter);
      return roleOk && genreOk;
    });
  }, [roleFilter, genreFilter]);

  const connectedProfiles = ALL_MATCHES.filter((m) => connected.includes(m.id));

  return (
    <AppShell title="The Guild" eyebrow="Collaboration">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">

        {/* Header */}
        <section className="border-b-[0.5px] border-white/10 bg-[#0d0d0b] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">The Guild</div>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Find your creative circle.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                No feeds. No likes. Opt-in matching for people who help finish, protect, and release the work.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="shrink-0 rounded-lg border-[0.5px] border-white/15 px-4 py-2 text-xs text-white/60 transition hover:border-white/30"
            >
              {myRole ? "Edit profile" : "Set up profile"}
            </button>
          </div>

          {/* My profile preview */}
          {myRole && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#534ab7] text-sm font-medium text-white">
                {profile.artistName?.[0] ?? "A"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white">{profile.artistName}</div>
                <div className="mt-0.5 text-xs text-white/35">{myRole}{myVibe ? ` · ${myVibe}` : ""}</div>
              </div>
              <span className="shrink-0 rounded-full bg-[#eaf3de] px-2.5 py-1 text-[10px] font-medium text-[#3b6d11]">Visible</span>
            </div>
          )}
        </section>

        {/* Filter chips */}
        <section className="border-b border-white/10 px-5 py-4">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Role</div>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-full border-[0.5px] px-3 py-1.5 text-xs transition ${
                  roleFilter === r
                    ? "border-[#534ab7] bg-[#534ab7] text-white"
                    : "border-white/10 bg-[#1e1e1b] text-white/55 hover:border-white/25"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="mt-3 mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Genre / vibe</div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenreFilter(g)}
                className={`rounded-full border-[0.5px] px-3 py-1.5 text-xs transition ${
                  genreFilter === g
                    ? "border-[#97c459]/80 bg-[#97c459]/20 text-[#97c459]"
                    : "border-white/10 bg-[#1e1e1b] text-white/55 hover:border-white/25"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* Song-specific spotlight match */}
        {activeSong && filtered.length > 0 && (
          <section className="border-b border-white/10 px-5 py-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
              Best match for &ldquo;{activeSong.title}&rdquo;
            </div>
            <div className={`flex items-center gap-3 rounded-xl border-[0.5px] border-[#534ab7]/50 bg-[#534ab7]/10 px-4 py-3`}>
              <div className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-medium ${avatarClass(filtered[0].tone)}`}>
                {filtered[0].initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium text-white">{filtered[0].name}</div>
                <div className="text-xs text-white/40">{filtered[0].role} · {filtered[0].fit}</div>
              </div>
              <button
                type="button"
                onClick={() => setConnected((c) => c.includes(filtered[0].id) ? c : [...c, filtered[0].id])}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  connected.includes(filtered[0].id)
                    ? "border border-[#97c459]/50 bg-[#97c459]/10 text-[#97c459]"
                    : "bg-[#534ab7] text-white"
                }`}
              >
                {connected.includes(filtered[0].id) ? "Connected ✓" : "Connect"}
              </button>
            </div>
          </section>
        )}

        {/* Match grid */}
        <section className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
              {filtered.length} match{filtered.length !== 1 ? "es" : ""}
            </div>
            {(roleFilter !== "All" || genreFilter !== "All") && (
              <button
                type="button"
                onClick={() => { setRoleFilter("All"); setGenreFilter("All"); }}
                className="text-[11px] text-white/30 hover:text-white/55"
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-dashed border-white/15 p-6 text-center">
              <div className="text-sm text-white/40">No matches for current filters.</div>
              <button
                type="button"
                onClick={() => { setRoleFilter("All"); setGenreFilter("All"); }}
                className="mt-3 text-xs text-white/30 hover:text-white/55"
              >
                Clear filters →
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((match) => {
                const isConnected = connected.includes(match.id);
                return (
                  <motion.div
                    key={match.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-medium ${avatarClass(match.tone)}`}>
                        {match.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-[15px] font-medium text-white">{match.name}</div>
                          {!match.open && (
                            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/35">Closed</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-white/35">{match.role} · {match.genres.join(" · ")}</div>
                        <div className="mt-0.5 text-xs text-white/25">{match.vibe}</div>
                        <p className="mt-2 text-sm text-white/55">{match.fit}</p>
                      </div>
                      <div className="shrink-0">
                        {isConnected ? (
                          activeSong ? (
                            <Link
                              href={`/projects/${activeSong.id}`}
                              className="block rounded-lg border-[0.5px] border-white/15 px-3 py-2 text-xs text-white/60"
                            >
                              Open Room
                            </Link>
                          ) : (
                            <span className="rounded-lg border-[0.5px] border-[#97c459]/50 bg-[#97c459]/10 px-3 py-2 text-xs text-[#97c459]">
                              Connected
                            </span>
                          )
                        ) : (
                          <button
                            type="button"
                            disabled={!match.open}
                            onClick={() => setConnected((c) => [...c, match.id])}
                            className="rounded-lg bg-[#eeedfe] px-3 py-2 text-xs font-medium text-[#534ab7] disabled:opacity-35"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Connected rooms */}
        {connectedProfiles.length > 0 && (
          <section className="border-t border-white/10 px-5 py-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Active collabs</div>
            <div className="space-y-2">
              {connectedProfiles.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3">
                  <div className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium ${avatarClass(m.tone)}`}>
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1 text-sm text-white/70">{m.name} · {m.role}</div>
                  {activeSong && (
                    <Link href={`/projects/${activeSong.id}`} className="text-xs text-white/35">
                      Room →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Profile setup sheet */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] bg-[rgba(20,20,18,0.92)] text-white backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y > 60) setProfileOpen(false); }}
            >
              <div className="flex justify-center pt-[10px] pb-1">
                <div className="h-1 w-9 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="text-[15px] font-medium">Guild profile</div>
                <button type="button" onClick={() => setProfileOpen(false)} className="text-2xl font-light text-white/30">×</button>
              </div>
              <div className="grid gap-4 p-5">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">Your role</span>
                  <input
                    value={myRole}
                    onChange={(e) => setMyRole(e.target.value)}
                    placeholder="Producer, songwriter, artist…"
                    className="h-12 w-full rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 text-white outline-none placeholder:text-white/25"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">Vibe / style</span>
                  <input
                    value={myVibe}
                    onChange={(e) => setMyVibe(e.target.value)}
                    placeholder="e.g. warm R&B, lo-fi soul, dark trap"
                    className="h-12 w-full rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 text-white outline-none placeholder:text-white/25"
                  />
                </label>
                <p className="text-[11px] text-white/30">
                  Your profile is visible to other Guild members who match your vibe. No DMs, no feeds — just opt-in matching.
                </p>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="h-12 rounded-xl bg-white text-sm font-medium text-[#0d0d0b]"
                >
                  Save profile
                </button>
                <div className="h-2" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
