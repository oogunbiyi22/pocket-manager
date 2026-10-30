import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────
// Same security shape as /api/v1/beats: Bearer token → Supabase user, every
// query scoped to that user. These tests lock in the auth posture, the
// graceful pre-migration fallback, and the honest send-state rules
// (a pitch can never move backwards, e.g. sent → opened-in-mail).

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PITCH_ID = "22222222-2222-4222-8222-222222222222";

// Result slots: `.single()`/`.maybeSingle()` resolve `singleResult`;
// awaiting a query chain directly resolves `listResult`.
let singleResult: { data: unknown; error: unknown } = { data: null, error: null };
let listResult: { data: unknown; error: unknown } = { data: [], error: null };

function makeChain() {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(singleResult));
  chain.maybeSingle = vi.fn(() => Promise.resolve(singleResult));
  chain.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(listResult).then(onFulfilled, onRejected);
  return chain;
}

const getUserMock = vi.fn((token: string) =>
  token === "good-token"
    ? Promise.resolve({ data: { user: { id: USER_ID } }, error: null })
    : Promise.resolve({ data: { user: null }, error: { message: "invalid token" } }),
);

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn((_url: string, key: string) =>
    key === "fake-service-role-key"
      ? { from: vi.fn(() => makeChain()) }
      : { auth: { getUser: getUserMock } },
  ),
}));

import { GET, POST, PATCH } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";
  singleResult = { data: null, error: null };
  listResult = { data: [], error: null };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(method: string, opts: { token?: string; body?: unknown; url?: string } = {}) {
  return new NextRequest(opts.url ?? "https://pocketmanager.online/api/v1/pitches", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

const VALID_PITCH = {
  songId: "song-1",
  songTitle: "Midnight Run",
  playlistName: "Late Night R&B",
  curatorName: "Casey Curator",
  curatorEmail: "casey@example.com",
  platform: "Spotify",
  followers: "284K",
  genre: "R&B",
  fitScore: 87,
  subject: "For Late Night R&B: Midnight Run",
  body: "Hi Casey — …",
  sendState: "draft",
};

const ROW = {
  id: PITCH_ID,
  playlist_name: "Late Night R&B",
  curator_name: "Casey Curator",
  curator_email: "casey@example.com",
  curator_handle: null,
  platform: "Spotify",
  followers: "284K",
  genre: "R&B",
  mood: null,
  fit_score: 87,
  song_id: "song-1",
  song_title: "Midnight Run",
  status: "queued",
  sent_date: null,
  pitch_subject: "For Late Night R&B: Midnight Run",
  pitch_body: "Hi Casey — …",
};

describe("/api/v1/pitches — auth", () => {
  it("rejects GET without a token", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("rejects POST without a token", async () => {
    const res = await POST(makeRequest("POST", { body: VALID_PITCH }));
    expect(res.status).toBe(401);
  });

  it("rejects PATCH with an invalid session token", async () => {
    const res = await PATCH(makeRequest("PATCH", { token: "bad-token", body: { id: PITCH_ID, sendState: "sent" } }));
    expect(res.status).toBe(401);
  });
});

describe("/api/v1/pitches — validation", () => {
  it("rejects a save with no playlist name", async () => {
    const res = await POST(
      makeRequest("POST", { token: "good-token", body: { ...VALID_PITCH, playlistName: "  " } }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a PATCH with nothing to update", async () => {
    const res = await PATCH(makeRequest("PATCH", { token: "good-token", body: { id: PITCH_ID } }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown send state", async () => {
    const res = await PATCH(
      makeRequest("PATCH", { token: "good-token", body: { id: PITCH_ID, sendState: "delivered" } }),
    );
    expect(res.status).toBe(400);
  });
});

describe("/api/v1/pitches — persistence behavior", () => {
  it("lists saved pitches in page shape", async () => {
    listResult = { data: [ROW], error: null };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.persisted).toBe(true);
    expect(json.pitches).toEqual([{
      id: PITCH_ID,
      songId: "song-1",
      songTitle: "Midnight Run",
      playlistName: "Late Night R&B",
      curatorName: "Casey Curator",
      curatorEmail: "casey@example.com",
      curatorHandle: "",
      platform: "Spotify",
      followers: "284K",
      genre: "R&B",
      mood: "",
      fitScore: 87,
      subject: "For Late Night R&B: Midnight Run",
      body: "Hi Casey — …",
      status: "queued",
      sentDate: "",
    }]);
  });

  it("creates a pitch as a draft", async () => {
    singleResult = { data: ROW, error: null };
    const res = await POST(makeRequest("POST", { token: "good-token", body: VALID_PITCH }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.persisted).toBe(true);
    expect(json.pitch.status).toBe("queued");
  });

  it("falls back gracefully when the table doesn't exist yet", async () => {
    listResult = {
      data: null,
      error: { code: "PGRST205", message: "Could not find the table 'public.user_playlist_pitches' in the schema cache" },
    };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ pitches: [], persisted: false });
  });

  it("falls back gracefully when the PATCH 005 columns are missing", async () => {
    singleResult = {
      data: null,
      error: { code: "42703", message: "column user_playlist_pitches.pitch_body does not exist" },
    };
    const res = await POST(makeRequest("POST", { token: "good-token", body: VALID_PITCH }));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.persisted).toBe(false);
  });
});

describe("/api/v1/pitches — honest send states", () => {
  it("allows draft → opened-in-mail (the mailto fallback state)", async () => {
    singleResult = { data: { status: "queued", sent_date: null }, error: null };
    listResult = { data: [{ ...ROW, status: "opened" }], error: null };
    const res = await PATCH(
      makeRequest("PATCH", { token: "good-token", body: { id: PITCH_ID, sendState: "opened-in-mail" } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pitch.status).toBe("opened");
    expect(json.pitch.sentDate).toBe("");
  });

  it("allows opened-in-mail → sent when the artist confirms", async () => {
    singleResult = { data: { status: "opened", sent_date: null }, error: null };
    listResult = { data: [{ ...ROW, status: "sent", sent_date: "2026-10-29" }], error: null };
    const res = await PATCH(
      makeRequest("PATCH", { token: "good-token", body: { id: PITCH_ID, sendState: "sent" } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pitch.status).toBe("sent");
    expect(json.pitch.sentDate).toBe("2026-10-29");
  });

  it("rejects sent → opened-in-mail (no silent un-sending)", async () => {
    singleResult = { data: { status: "sent", sent_date: "2026-10-20" }, error: null };
    const res = await PATCH(
      makeRequest("PATCH", { token: "good-token", body: { id: PITCH_ID, sendState: "opened-in-mail" } }),
    );
    expect(res.status).toBe(409);
  });

  it("404s a state change for a pitch the user doesn't own", async () => {
    singleResult = { data: null, error: null };
    const res = await PATCH(
      makeRequest("PATCH", { token: "good-token", body: { id: PITCH_ID, sendState: "sent" } }),
    );
    expect(res.status).toBe(404);
  });
});
