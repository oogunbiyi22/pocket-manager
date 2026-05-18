"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import type { GuildMember } from "@/app/api/v1/guild/members/route";

// ─── Types ───────────────────────────────────────────────────────────────────

type FollowStatus = "none" | "pending" | "following";
type GuildState = { following: string[]; pendingSent: string[]; pendingReceived: string[] };

const STORAGE_KEY = "guild-state-v2";

const ROLES = ["All", "Artist", "Producer", "Songwriter", "Vocalist", "Mix Engineer", "Multi-hyphenate"];

// ─── Storage ─────────────────────────────────────────────────────────────────

function loadState(): GuildState {
  if (typeof window === "undefined") return { following: [], pendingSent: [], pendingReceived: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuildState) : { following: [], pendingSent: [], pendingReceived: [] };
  } catch { return { following: [], pendingSent: [], pendingReceived: [] }; }
}

function saveState(s: GuildState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const ACCENT_COLORS = ["#ef9f27", "#c47fcf", "#97c459", "#6c9fcf", "#e24b4a", "#9fcfb0", "#cf9f6c", "#cfb04f", "#7fcfcf", "#d4a0e8"];

function accentFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

function Avatar({ name, id, size = 48 }: { name: string; id: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="shrink-0 grid place-items-center rounded-full font-semibold text-[#0d0d0b] select-none"
      style={{ width: size, height: size, fontSize: size * 0.34, backgroundColor: accentFor(id) }}
    >
      {initials}
    </div>
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
  member: GuildMember;
  status: FollowStatus;
  onFollow: (m: GuildMember) => void;
  onUnfollow: (id: string) => void;
  isMe: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden transition hover:border-[#ef9f27]/20 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={member.artistName} id={member.id} size={50} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-[var(--text-primary)] truncate">{member.artistName}</div>
          <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{member.role} · {member.genre}</div>
          <div className="mt-1 text-[10px] text-[var(--text-muted)]">
            Joined {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </div>
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
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuildPage() {
  const { profile } = usePocket();
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  const [state, setState] = useState<GuildState>(() => loadState());
  const [tab, setTab] = useState<"discover" | "following">("discover");
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/v1/guild/members")
      .then((r) => r.json())
      .then((data: { members: GuildMember[]; configured: boolean }) => {
        setMembers(data.members ?? []);
        setConfigured(data.configured ?? false);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (id: string): FollowStatus => {
    if (state.following.includes(id)) return "following";
    if (state.pendingSent.includes(id)) return "pending";
    return "none";
  };

  const handleFollow = (member: GuildMember) => {
    setState((prev) => {
      const next = { ...prev, following: [...prev.following, member.id] };
      saveState(next);
      return next;
    });
  };

  const handleUnfollow = (id: string) => {
    setState((prev) => {
      const next = { ...prev, following: prev.following.filter((f) => f !== id), pendingSent: prev.pendingSent.filter((f) => f !== id) };
      saveState(next);
      return next;
    });
  };

  const visibleMembers = useMemo(() => {
    return members.filter((m) => {
      const byRole = roleFilter === "All" || m.role === roleFilter;
      const bySearch = !search.trim() ||
        m.artistName.toLowerCase().includes(search.toLowerCase()) ||
        m.genre.toLowerCase().includes(search.toLowerCase()) ||
        m.role.toLowerCase().includes(search.toLowerCase());
      if (tab === "following") return state.following.includes(m.id) && byRole && bySearch;
      return byRole && bySearch;
    });
  }, [tab, roleFilter, search, state.following, members]);

  const myFollowing = state.following.length;

  return (
    <AppShell title="" eyebrow="">
      <div className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ef9f27]/70 mb-2">The Guild</div>
        <h1 className="text-[34px] font-light tracking-[-0.025em] text-[var(--text-primary)] sm:text-[42px]">
          Your creative network.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-muted)]">
          Real artists, producers, and creators building on Pocket Manager. Follow to connect and collaborate.
        </p>

        <div className="mt-6 flex items-center gap-6">
          <div>
            <div className="text-[24px] font-light text-[var(--text-primary)]">{members.length}</div>
            <div className="text-[12px] text-[var(--text-muted)]">members</div>
          </div>
          <div className="h-8 w-px bg-[var(--border-subtle)]" />
          <div>
            <div className="text-[24px] font-light text-[var(--text-primary)]">{myFollowing}</div>
            <div className="text-[12px] text-[var(--text-muted)]">following</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-1">
        {(["discover", "following"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2.5 text-[13px] font-medium transition capitalize ${
              tab === t ? "bg-[#0d0d0b] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search + filters */}
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

      {/* States */}
      {loading && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-6 py-14 text-center text-[14px] text-[var(--text-muted)]">
          Loading members…
        </div>
      )}

      {!loading && !configured && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-6 py-14 text-center">
          <div className="text-[15px] font-medium text-[var(--text-primary)]">Guild not connected</div>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars to enable the Guild directory.</p>
        </div>
      )}

      {!loading && configured && members.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-6 py-14 text-center">
          <div className="text-[30px] mb-3">🎵</div>
          <div className="text-[15px] font-medium text-[var(--text-primary)]">Be the first in the Guild</div>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">No artists have joined yet. Complete your profile to appear here.</p>
        </div>
      )}

      {!loading && configured && visibleMembers.length === 0 && members.length > 0 && (
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

      {!loading && visibleMembers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              status={getStatus(member.id)}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              isMe={member.artistName === profile.artistName}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
