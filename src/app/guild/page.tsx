"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getSupabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

type GuildProfile = {
  user_id: string;
  display_name: string;
  role: string | null;
  genres: string[];
  vibe: string | null;
  open: boolean;
};

type GuildMessage = {
  id: string;
  room: string;
  user_id: string | null;
  display_name: string;
  content: string;
  created_at: string;
};

// ─── Seed profiles shown to non-authenticated or first-time users ────────────
const SEED_PROFILES: GuildProfile[] = [
  { user_id: "seed-1", display_name: "Nova Keys", role: "Producer", genres: ["Lo-fi", "Soul"], vibe: "warm drums", open: true },
  { user_id: "seed-2", display_name: "Remy Sol", role: "Songwriter", genres: ["R&B", "Neo Soul"], vibe: "hook-writing", open: true },
  { user_id: "seed-3", display_name: "Ayo J", role: "Artist", genres: ["Afrobeats", "R&B"], vibe: "feature energy", open: true },
  { user_id: "seed-4", display_name: "Lena Moore", role: "Vocalist", genres: ["Soul", "Gospel"], vibe: "layered harmonies", open: true },
  { user_id: "seed-5", display_name: "TRQ", role: "Producer", genres: ["Trap", "R&B"], vibe: "808 architect", open: false },
  { user_id: "seed-6", display_name: "Mika St.", role: "Songwriter", genres: ["Indie", "Pop"], vibe: "bridge specialist", open: true },
];

const ROLES = ["All", "Producer", "Songwriter", "Artist", "Vocalist", "Engineer", "DJ"];
const GENRES = ["All", "R&B", "Soul", "Lo-fi", "Afrobeats", "Pop", "Trap", "Hip-Hop", "Gospel", "Indie"];

function avatarColor(name: string) {
  const colors = [
    "bg-[#cecbf6] text-[#3c3489]",
    "bg-[#9fe1cb] text-[#085041]",
    "bg-[#f4c0d1] text-[#72243e]",
    "bg-[#faeeda] text-[#854f0b]",
    "bg-[#d4edff] text-[#1a5a8a]",
  ];
  const i = name.charCodeAt(0) % colors.length;
  return colors[i];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function GuildPage() {
  const { profile, signedIn } = usePocket();
  const supabase = getSupabase();

  // ── Tab state ───────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"browse" | "chat">("browse");

  // ── Profile state ───────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const [myName, setMyName] = useState(profile.artistName ?? "");
  const [myRole, setMyRole] = useState(profile.role ?? "");
  const [myVibe, setMyVibe] = useState(profile.vibe ?? "");
  const [myGenres, setMyGenres] = useState<string[]>([]);
  const [myOpen, setMyOpen] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [guildProfileSaved, setGuildProfileSaved] = useState(false);

  // ── Members ─────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<GuildProfile[]>(SEED_PROFILES);
  const [membersLoading, setMembersLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");

  // ── Chat ────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<GuildMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load guild profiles from Supabase ────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    setMembersLoading(true);
    supabase
      .from("guild_profiles")
      .select("user_id, display_name, role, genres, vibe, open")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: GuildProfile[] | null }) => {
        if (data && data.length > 0) setMembers(data);
        setMembersLoading(false);
      });
  }, [supabase]);

  // ── Load recent messages + subscribe to realtime ──────────────────────────
  useEffect(() => {
    if (!supabase) return;

    setChatLoading(true);

    // Load last 50 messages
    supabase
      .from("guild_messages")
      .select("id, room, user_id, display_name, content, created_at")
      .eq("room", "general")
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }: { data: GuildMessage[] | null }) => {
        if (data) setMessages(data);
        setChatLoading(false);
      });

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("guild_messages:general")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guild_messages", filter: "room=eq.general" },
        (payload: { new: GuildMessage }) => {
          setMessages((prev) => {
            // Avoid duplicates if the sender receives their own broadcast
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Save guild profile to Supabase ───────────────────────────────────────
  const saveProfile = useCallback(async () => {
    if (!supabase || !signedIn || !myName.trim()) return;
    setProfileSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfileSaving(false); return; }

    await supabase.from("guild_profiles").upsert({
      user_id: user.id,
      display_name: myName.trim(),
      role: myRole || null,
      genres: myGenres,
      vibe: myVibe || null,
      open: myOpen,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Refresh member list
    const { data } = await supabase
      .from("guild_profiles")
      .select("user_id, display_name, role, genres, vibe, open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data && data.length > 0) setMembers(data as GuildProfile[]);

    setProfileSaving(false);
    setGuildProfileSaved(true);
    setProfileOpen(false);
    setTimeout(() => setGuildProfileSaved(false), 3000);
  }, [supabase, signedIn, myName, myRole, myGenres, myVibe, myOpen]);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || !supabase) return;

    const displayName = myName || profile.artistName || "Artist";

    if (!signedIn) {
      // Optimistic local-only message for non-auth users (won't persist)
      const local: GuildMessage = {
        id: `local-${Date.now()}`,
        room: "general",
        user_id: null,
        display_name: displayName,
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, local]);
      setChatInput("");
      return;
    }

    setSending(true);
    setChatInput("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }

    await supabase.from("guild_messages").insert({
      room: "general",
      user_id: user.id,
      display_name: displayName,
      content: text,
    });

    setSending(false);
  }, [chatInput, supabase, signedIn, myName, profile.artistName]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // ── Filtered members ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const roleOk = roleFilter === "All" || m.role === roleFilter;
      const genreOk = genreFilter === "All" || m.genres?.includes(genreFilter);
      return roleOk && genreOk;
    });
  }, [members, roleFilter, genreFilter]);

  const myDisplayName = myName || profile.artistName || "";

  return (
    <AppShell title="The Guild" eyebrow="Collaboration">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-white/10 bg-[#141412] text-white">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section className="border-b-[0.5px] border-white/10 bg-[#0d0d0b] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The Guild</div>
              <h2 className="mt-2 text-3xl font-light tracking-[-0.03em]">Find your creative circle.</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">
                No feeds. No likes. Opt-in matching for artists, producers, and writers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="shrink-0 rounded-xl border-[0.5px] border-white/15 px-4 py-2 text-xs text-white/50 transition hover:border-white/35 hover:text-white/80 active:scale-95"
            >
              {myDisplayName ? "Edit profile" : "Join Guild"}
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 rounded-xl border-[0.5px] border-white/10 bg-white/[0.04] p-1">
            {(["browse", "chat"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-[12px] font-medium capitalize transition ${
                  tab === t ? "bg-white text-[#0d0d0b]" : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "browse" ? `Browse · ${members.length}` : "Chat · General"}
              </button>
            ))}
          </div>
        </section>

        {/* ── Browse tab ──────────────────────────────────────────────────── */}
        {tab === "browse" && (
          <section className="p-5">
            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="flex gap-1 overflow-x-auto">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                      roleFilter === r ? "bg-white text-[#0d0d0b]" : "border-[0.5px] border-white/15 text-white/45 hover:text-white/70"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-[16px] bg-white/[0.04]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-white/35">No matches for those filters.</p>
                <button
                  type="button"
                  onClick={() => { setRoleFilter("All"); setGenreFilter("All"); }}
                  className="mt-3 text-xs text-white/35 underline underline-offset-2"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((member) => (
                  <div
                    key={member.user_id}
                    className="rounded-[16px] border-[0.5px] border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${avatarColor(member.display_name)}`}>
                        {initials(member.display_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-medium text-white">{member.display_name}</span>
                          {member.open && (
                            <span className="rounded-full bg-[#97c459]/20 px-2 py-0.5 text-[10px] font-medium text-[#97c459]">
                              Open
                            </span>
                          )}
                        </div>
                        {member.role && (
                          <div className="mt-0.5 text-[12px] text-white/45">{member.role}</div>
                        )}
                        {member.vibe && (
                          <div className="mt-1 text-[12px] italic text-white/30">"{member.vibe}"</div>
                        )}
                        {member.genres?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {member.genres.slice(0, 3).map((g) => (
                              <span key={g} className="rounded-full border-[0.5px] border-white/15 px-2 py-0.5 text-[10px] text-white/40">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Not in the guild yet CTA */}
            {!guildProfileSaved && !myDisplayName && (
              <div className="mt-6 rounded-[16px] border-[0.5px] border-dashed border-white/15 p-5 text-center">
                <p className="text-sm text-white/35">You&apos;re not in the Guild yet.</p>
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="mt-3 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0d0d0b] transition hover:bg-white/90 active:scale-95"
                >
                  Join the Guild →
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Chat tab ────────────────────────────────────────────────────── */}
        {tab === "chat" && (
          <section className="flex h-[480px] flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {chatLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div className="text-2xl">💬</div>
                  <p className="text-sm text-white/35">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isMe = msg.display_name === myDisplayName && myDisplayName !== "";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarColor(msg.display_name)}`}>
                          {initials(msg.display_name)}
                        </div>
                        <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                          <div className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
                            isMe
                              ? "rounded-tr-sm bg-white text-[#0d0d0b]"
                              : "rounded-tl-sm bg-white/[0.08] text-white"
                          }`}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] text-white/25">{msg.display_name}</span>
                            <span className="text-[10px] text-white/20">·</span>
                            <span className="text-[10px] text-white/20">{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t-[0.5px] border-white/10 p-3">
              {!signedIn && (
                <p className="mb-2 text-center text-[11px] text-white/30">
                  Sign in to send messages — your messages won&apos;t persist without an account.
                </p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={myDisplayName ? "Say something…" : "Set up your profile to chat"}
                  rows={1}
                  maxLength={500}
                  className="flex-1 resize-none rounded-xl border-[0.5px] border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/30 transition"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!chatInput.trim() || sending}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0d0d0b] transition hover:bg-white/90 disabled:opacity-30 active:scale-95"
                  aria-label="Send"
                >
                  {sending ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-[#0d0d0b]/20 border-t-[#0d0d0b]" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Profile setup modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              key="modal"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg"
            >
              <div className="m-3 overflow-hidden rounded-[28px] bg-[#0d0d0b] text-white">
                <div className="flex items-center justify-between px-6 pt-6">
                  <h3 className="text-lg font-light">Your Guild profile</h3>
                  <button type="button" onClick={() => setProfileOpen(false)} className="text-white/35 hover:text-white/70 text-xl">×</button>
                </div>

                <div className="space-y-4 px-6 pb-6 pt-4">
                  <label className="block">
                    <div className="mb-1.5 text-[11px] uppercase tracking-[0.18em] text-white/35">Display name</div>
                    <input
                      type="text"
                      value={myName}
                      onChange={(e) => setMyName(e.target.value)}
                      placeholder={profile.artistName || "Your artist name"}
                      className="w-full rounded-xl border-[0.5px] border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/35"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1.5 text-[11px] uppercase tracking-[0.18em] text-white/35">Your role</div>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.filter((r) => r !== "All").map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setMyRole(myRole === r ? "" : r)}
                          className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                            myRole === r ? "bg-white text-[#0d0d0b]" : "border-[0.5px] border-white/15 text-white/45 hover:text-white/70"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="block">
                    <div className="mb-1.5 text-[11px] uppercase tracking-[0.18em] text-white/35">Genres</div>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.filter((g) => g !== "All").map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setMyGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])}
                          className={`rounded-full px-3 py-1.5 text-[12px] transition ${
                            myGenres.includes(g) ? "bg-white text-[#0d0d0b] font-medium" : "border-[0.5px] border-white/15 text-white/45 hover:text-white/70"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="block">
                    <div className="mb-1.5 text-[11px] uppercase tracking-[0.18em] text-white/35">Your vibe (one line)</div>
                    <input
                      type="text"
                      value={myVibe}
                      onChange={(e) => setMyVibe(e.target.value)}
                      placeholder="e.g. late-night melodic rap"
                      maxLength={80}
                      className="w-full rounded-xl border-[0.5px] border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/35"
                    />
                  </label>

                  <div className="flex items-center justify-between rounded-xl border-[0.5px] border-white/10 px-4 py-3">
                    <div>
                      <div className="text-sm text-white">Open to collaborations</div>
                      <div className="text-[11px] text-white/35">Others can reach out to you</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMyOpen((v) => !v)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${myOpen ? "bg-[#97c459]" : "bg-white/20"}`}
                    >
                      <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${myOpen ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>

                  {!signedIn && (
                    <p className="rounded-xl border-[0.5px] border-[#ef9f27]/30 bg-[#ef9f27]/10 px-4 py-3 text-[12px] text-[#ef9f27]">
                      Sign in to save your Guild profile and appear in the member list.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={!myName.trim() || profileSaving}
                    className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-[#0d0d0b] transition hover:bg-white/90 disabled:opacity-40 active:scale-[0.98]"
                  >
                    {profileSaving ? "Saving…" : signedIn ? "Save to Guild →" : "Save locally"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {guildProfileSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#97c459] px-5 py-2.5 text-sm font-semibold text-[#0d0d0b] shadow-lg"
          >
            Profile saved to Guild ✓
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
