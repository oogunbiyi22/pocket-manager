"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

// ─── Types ───────────────────────────────────────────────────────────────────

type Member = {
  id: string;
  name: string;
  role: string;
  genres: string[];
  bio: string;
  location: string;
  followers: number;
  following: number;
  topSong?: string;
  isPrivate: boolean;
  accentColor: string;
};

type GuildState = {
  following: string[];
  pendingSent: string[];
  pendingReceived: string[];
};

type FollowStatus = "none" | "pending" | "following";

const STORAGE_KEY = "guild-state-v1";

// ─── Guild members ───────────────────────────────────────────────────────────

const MEMBERS: Member[] = [
  { id: "nova-keys",    name: "Nova Keys",    role: "Producer",        genres: ["Lo-fi","Soul","Jazz"],         bio: "Crafting textured instrumentals from midnight sessions. Signed to nobody. Beholden to no one.",               location: "Brooklyn, NY",  followers: 1240, following: 88,  topSong: "3am Interlude",  isPrivate: false, accentColor: "#ef9f27" },
  { id: "remy-sol",     name: "Remy Sol",     role: "Songwriter",      genres: ["R&B","Neo Soul","Pop"],         bio: "I write for the feeling you can't describe. Co-written cuts on two major label projects.",                   location: "Atlanta, GA",   followers: 890,  following: 214, topSong: "Slow Dance",     isPrivate: true,  accentColor: "#c47fcf" },
  { id: "ayo-j",        name: "Ayo J",        role: "Artist",          genres: ["Afrobeats","R&B","Dancehall"],  bio: "Lagos to London to everywhere. Sound travels, roots stay.",                                                location: "London, UK",    followers: 3100, following: 302, topSong: "Jeje",           isPrivate: false, accentColor: "#97c459" },
  { id: "lena-moore",   name: "Lena Moore",   role: "Vocalist",        genres: ["Soul","Gospel","Jazz"],         bio: "Session vocalist. 200+ credits. If you need it to move people, call me.",                                  location: "Nashville, TN", followers: 2050, following: 140, topSong: "Higher Ground",  isPrivate: true,  accentColor: "#6c9fcf" },
  { id: "dex-vibes",    name: "Dex Vibes",    role: "Producer",        genres: ["Hip-Hop","Trap","Drill"],       bio: "Production built different. 808s with soul, drums with intention.",                                        location: "Chicago, IL",   followers: 4400, following: 190, topSong: "Stay Low",       isPrivate: false, accentColor: "#e24b4a" },
  { id: "summer-ali",   name: "Summer Ali",   role: "Artist",          genres: ["Alt R&B","Indie","Electronic"], bio: "Dark. Warm. Honest. I make music I wish existed when I was 19.",                                           location: "Toronto, CA",   followers: 1820, following: 255, topSong: "Glass Ceiling",  isPrivate: false, accentColor: "#9fcfb0" },
  { id: "priest-james", name: "Priest James", role: "Mix Engineer",    genres: ["Hip-Hop","R&B","Rock"],         bio: "Mixing engineer. 10 years in the room. If your record sounds wrong, I know why.",                          location: "Los Angeles, CA", followers: 670, following: 77,                         isPrivate: false, accentColor: "#cf9f6c" },
  { id: "zora-west",    name: "Zora West",    role: "Multi-hyphenate", genres: ["Neo Soul","Funk","Jazz"],       bio: "Writer, producer, vocalist. Three is one when the vision is clear.",                                       location: "Detroit, MI",   followers: 2340, following: 311, topSong: "Root Work",      isPrivate: true,  accentColor: "#cfb04f" },
  { id: "kai-nolen",    name: "Kai Nolen",    role: "Songwriter",      genres: ["Country","Folk","Americana"],   bio: "Story-first. Every chord has a reason.",                                                                   location: "Austin, TX",    followers: 990,  following: 165, topSong: "Red Clay Roads", isPrivate: false, accentColor: "#b8956a" },
  { id: "simi-diallo",  name: "Simi Diallo",  role: "Producer",        genres: ["Afrobeats","Amapiano","Soul"],  bio: "Lagos soundwaves in a studio in Shoreditch. The whole continent in one hard drive.",                        location: "London, UK",    followers: 3800, following: 280, topSong: "Amara",          isPrivate: false, accentColor: "#ef9f27" },
  { id: "cole-fray",    name: "Cole Fray",    role: "Artist",          genres: ["Indie Rock","Alternative"],     bio: "Guitar and grief. Sometimes funny.",                                                                       location: "Portland, OR",  followers: 1100, following: 430, topSong: "Fault Lines",    isPrivate: true,  accentColor: "#9fa0cf" },
  { id: "maya-banks",   name: "Maya Banks",   role: "Vocalist",        genres: ["R&B","Pop","Gospel"],           bio: "Background to featured. I bring the run that makes it memorable.",                                         location: "Houston, TX",   followers: 1670, following: 188, topSong: "Overflow",       isPrivate: false, accentColor: "#cf7f9f" },
  { id: "theo-rux",     name: "Theo Rux",     role: "Producer",        genres: ["Electronic","House","Ambient"], bio: "Texture above tempo. Space is part of the sound.",                                                         location: "Berlin, DE",    followers: 2200, following: 90,  topSong: "Vapour",         isPrivate: false, accentColor: "#7fcfcf" },
  { id: "asia-moon",    name: "Asia Moon",    role: "Artist",          genres: ["K-R&B","Pop","Electropop"],     bio: "Seoul to Seoul. Crossing genres the same way I cross time zones.",                                         location: "Seoul, KR",     followers: 5100, following: 320, topSong: "Moonphase",      isPrivate: true,  accentColor: "#d4a0e8" },
  { id: "joel-vega",    name: "Joel Vega",    role: "Multi-hyphenate", genres: ["Latin Pop","Reggaeton","R&B"],  bio: "Productor y artista. El ritmo no miente.",                                                                 location: "Miami, FL",     followers: 4200, following: 270, topSong: "La Marea",       isPrivate: false, accentColor: "#e8a44a" },
];

const ROLES = ["All", "Artist", "Producer", "Songwriter", "Vocalist", "Mix Engineer", "Multi-hyphenate"];

// ─── Storage ─────────────────────────────────────────────────────────────────

function loadState(): GuildState {
  if (typeof window === "undefined") return { following: [], pendingSent: [], pendingReceived: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { following: [], pendingSent: [], pendingReceived: [] };
    return JSON.parse(raw) as GuildState;
  } catch { return { following: [], pendingSent: [], pendingReceived: [] }; }
}

function saveState(s: GuildState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="shrink-0 grid place-items-center rounded-full font-semibold text-[#0d0d0b] select-none"
      style={{ width: size, height: size, fontSize: size * 0.34, backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ─── Lock icon ────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/25">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

// ─── Member card ─────────────────────────────────────────────────────────────

function MemberCard({
  member,
  status,
  onFollow,
  onUnfollow,
  isMe,
}: {
  member: Member;
  status: FollowStatus;
  onFollow: (m: Member) => void;
  onUnfollow: (id: string) => void;
  isMe: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden transition hover:border-[#ef9f27]/20">
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <Avatar name={member.name} color={member.accentColor} size={50} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-medium text-[var(--text-primary)] truncate">{member.name}</span>
              {member.isPrivate && <LockIcon />}
            </div>
            <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{member.role} · {member.location}</div>
          </div>
          {!isMe && (
            <button
              onClick={() => status === "following" ? onUnfollow(member.id) : onFollow(member)}
              className={`shrink-0 rounded-xl px-4 py-1.5 text-[12px] font-semibold transition active:scale-[0.97] ${
                status === "following"
                  ? "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-red-400/30 hover:text-red-400/70"
                  : status === "pending"
                  ? "border border-[#ef9f27]/30 bg-[#ef9f27]/[0.07] text-[#ef9f27]/70"
                  : "bg-[#ef9f27] text-[#0d0d0b] hover:bg-[#f5b048] shadow-sm"
              }`}
            >
              {status === "following" ? "Following" : status === "pending" ? "Requested" : "Follow"}
            </button>
          )}
          {isMe && (
            <span className="shrink-0 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] text-[var(--text-muted)]">You</span>
          )}
        </div>

        {/* Follower stats */}
        <div className="mt-3 flex gap-5">
          <div>
            <div className="text-[15px] font-medium text-[var(--text-primary)]">{member.followers.toLocaleString()}</div>
            <div className="text-[11px] text-[var(--text-muted)]">followers</div>
          </div>
          <div>
            <div className="text-[15px] font-medium text-[var(--text-primary)]">{member.following.toLocaleString()}</div>
            <div className="text-[11px] text-[var(--text-muted)]">following</div>
          </div>
          {member.topSong && (
            <div className="flex-1 min-w-0 self-end pb-0.5">
              <div className="truncate text-[12px] italic text-[var(--text-muted)]">&ldquo;{member.topSong}&rdquo;</div>
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.genres.map((g) => (
            <span key={g} className="rounded-full bg-black/[0.06] dark:bg-white/[0.07] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)]">{g}</span>
          ))}
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full border-t border-[var(--border-subtle)] px-4 py-2.5 text-left text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition flex items-center justify-between"
      >
        <span>{open ? "Less" : "Bio & connect"}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-3 space-y-3">
          <p className="text-[13px] leading-6 text-[var(--text-muted)]">{member.bio}</p>
          {status === "following" ? (
            <div className="rounded-xl border border-[#97c459]/25 bg-[#97c459]/[0.06] px-4 py-3">
              <div className="text-[12px] font-semibold text-[#97c459]">Connected</div>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">You can invite {member.name.split(" ")[0]} into your projects from the project room.</p>
            </div>
          ) : status === "pending" ? (
            <div className="rounded-xl border border-[#ef9f27]/25 bg-[#ef9f27]/[0.06] px-4 py-3">
              <div className="text-[12px] font-semibold text-[#ef9f27]">Request pending</div>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Waiting for {member.name.split(" ")[0]} to approve your follow request.</p>
            </div>
          ) : !isMe ? (
            <button
              onClick={() => onFollow(member)}
              className="w-full rounded-xl bg-[#ef9f27] py-3 text-[13px] font-semibold text-[#0d0d0b] hover:bg-[#f5b048] transition active:scale-[0.98] shadow-sm"
            >
              {member.isPrivate ? "Send follow request" : "Follow"} →
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Requests tab ─────────────────────────────────────────────────────────────

function RequestsTab({
  received,
  onApprove,
  onDecline,
}: {
  received: string[];
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const members = MEMBERS.filter((m) => received.includes(m.id));

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-6 py-14 text-center">
        <div className="text-3xl mb-3">📭</div>
        <div className="text-[15px] font-medium text-[var(--text-primary)]">No pending requests</div>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">When artists send you follow requests, they appear here for approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[var(--text-muted)] mb-4">Approve a request to allow collaboration — they can then be invited into your projects.</p>
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4">
          <Avatar name={m.name} color={m.accentColor} size={46} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium text-[var(--text-primary)]">{m.name}</div>
            <div className="text-[12px] text-[var(--text-muted)]">{m.role} · {m.genres[0]}</div>
            <div className="mt-1 text-[11px] text-[var(--text-muted)]">{m.followers.toLocaleString()} followers</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onDecline(m.id)}
              className="rounded-xl border border-[var(--border-subtle)] px-3.5 py-2 text-[12px] text-[var(--text-muted)] hover:border-red-400/30 hover:text-red-400/70 transition"
            >
              Decline
            </button>
            <button
              onClick={() => onApprove(m.id)}
              className="rounded-xl bg-[#97c459] px-3.5 py-2 text-[12px] font-semibold text-[#0d0d0b] hover:bg-[#a8d46a] transition"
            >
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuildPage() {
  const { profile } = usePocket();
  const [state, setState] = useState<GuildState>({ following: [], pendingSent: [], pendingReceived: [] });
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"discover" | "following" | "requests">("discover");
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    const s = loadState();
    if (!existing) {
      // Seed pending requests for first-time users
      s.pendingReceived = ["remy-sol", "lena-moore"];
      saveState(s);
    }
    setState(s);
    setMounted(true);
  }, []);

  const getStatus = (id: string): FollowStatus => {
    if (state.following.includes(id)) return "following";
    if (state.pendingSent.includes(id)) return "pending";
    return "none";
  };

  const handleFollow = (member: Member) => {
    setState((prev) => {
      const next = member.isPrivate
        ? { ...prev, pendingSent: [...prev.pendingSent, member.id] }
        : { ...prev, following: [...prev.following, member.id] };
      saveState(next);
      return next;
    });
  };

  const handleUnfollow = (id: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        following: prev.following.filter((f) => f !== id),
        pendingSent: prev.pendingSent.filter((f) => f !== id),
      };
      saveState(next);
      return next;
    });
  };

  const handleApprove = (id: string) => {
    setState((prev) => {
      const next = { ...prev, pendingReceived: prev.pendingReceived.filter((r) => r !== id) };
      saveState(next);
      return next;
    });
  };

  const handleDecline = (id: string) => {
    setState((prev) => {
      const next = { ...prev, pendingReceived: prev.pendingReceived.filter((r) => r !== id) };
      saveState(next);
      return next;
    });
  };

  const visibleMembers = useMemo(() => {
    return MEMBERS.filter((m) => {
      const byRole = roleFilter === "All" || m.role === roleFilter;
      const bySearch = !search.trim() || m.name.toLowerCase().includes(search.toLowerCase()) || m.genres.some((g) => g.toLowerCase().includes(search.toLowerCase())) || m.role.toLowerCase().includes(search.toLowerCase());
      if (tab === "following") return state.following.includes(m.id) && byRole && bySearch;
      return byRole && bySearch;
    });
  }, [tab, roleFilter, search, state.following]);

  // Simulated: people who follow you back
  const myFollowers = state.following.length + 4;
  const myFollowing = state.following.length;

  if (!mounted) return null;

  return (
    <AppShell title="" eyebrow="">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ef9f27]/70 mb-2">The Guild</div>
        <h1 className="text-[34px] font-light tracking-[-0.025em] text-[var(--text-primary)] sm:text-[42px]">
          Your creative network.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-muted)]">
          Follow producers, songwriters, and artists you want to work with. When they approve, you can invite them into your projects directly.
        </p>

        {/* Your stats bar */}
        <div className="mt-6 flex items-center gap-6">
          <div>
            <div className="text-[24px] font-light text-[var(--text-primary)]">{myFollowers}</div>
            <div className="text-[12px] text-[var(--text-muted)]">followers</div>
          </div>
          <div className="h-8 w-px bg-[var(--border-subtle)]" />
          <div>
            <div className="text-[24px] font-light text-[var(--text-primary)]">{myFollowing}</div>
            <div className="text-[12px] text-[var(--text-muted)]">following</div>
          </div>
          {state.pendingReceived.length > 0 && (
            <>
              <div className="h-8 w-px bg-[var(--border-subtle)]" />
              <button onClick={() => setTab("requests")} className="group text-left">
                <div className="text-[24px] font-light text-[#ef9f27]">{state.pendingReceived.length}</div>
                <div className="text-[12px] text-[#ef9f27]/60 group-hover:text-[#ef9f27] transition">requests</div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-1">
        {(["discover", "following", "requests"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2.5 text-[13px] font-medium transition capitalize ${
              tab === t
                ? "bg-[#0d0d0b] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t}
            {t === "requests" && state.pendingReceived.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-[#ef9f27] px-1.5 text-[10px] font-bold text-[#0d0d0b]">
                {state.pendingReceived.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Requests tab ───────────────────────────────────────────────────── */}
      {tab === "requests" && (
        <RequestsTab
          received={state.pendingReceived}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      )}

      {/* ── Discover / Following ────────────────────────────────────────────── */}
      {tab !== "requests" && (
        <>
          {/* Search + role filters */}
          <div className="mb-5 space-y-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, genre, or role…"
              className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[#ef9f27]/40 transition"
            />
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${
                    roleFilter === r
                      ? "border-[#ef9f27]/50 bg-[#ef9f27]/10 text-[#ef9f27]"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {visibleMembers.length === 0 && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-6 py-14 text-center">
              <div className="text-[15px] font-medium text-[var(--text-primary)]">
                {tab === "following" ? "You're not following anyone yet." : "No members match that filter."}
              </div>
              {tab === "following" && (
                <button onClick={() => setTab("discover")} className="mt-4 text-[13px] text-[#ef9f27] hover:underline">
                  Discover artists →
                </button>
              )}
            </div>
          )}

          {/* Member grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                status={getStatus(member.id)}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                isMe={member.name === profile.artistName}
              />
            ))}
          </div>
        </>
      )}

    </AppShell>
  );
}
