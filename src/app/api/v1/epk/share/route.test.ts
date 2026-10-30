import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────
// The share token is a credential: these tests lock in that it is only ever
// read/written for the authenticated owner (every query is scoped by the
// user id from the verified session), that unauthenticated callers get
// nothing, and that the route degrades gracefully before PATCH 005 runs.

const USER_ID = "11111111-1111-4111-8111-111111111111";

let singleResult: { data: unknown; error: unknown } = { data: null, error: null };
let listResult: { data: unknown; error: unknown } = { data: [], error: null };
let lastEqArgs: unknown[] = [];

function makeChain() {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "delete", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.eq = vi.fn((...args: unknown[]) => {
    lastEqArgs = args;
    return chain;
  });
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

import { GET, POST, DELETE } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";
  singleResult = { data: null, error: null };
  listResult = { data: [], error: null };
  lastEqArgs = [];
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(method: string, opts: { token?: string; body?: unknown } = {}) {
  return new NextRequest("https://pocketmanager.online/api/v1/epk/share", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

describe("/api/v1/epk/share — auth", () => {
  it("rejects GET without a token", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("rejects POST without a token", async () => {
    const res = await POST(makeRequest("POST", { body: { regenerate: true } }));
    expect(res.status).toBe(401);
  });

  it("rejects DELETE with an invalid session token", async () => {
    const res = await DELETE(makeRequest("DELETE", { token: "bad-token" }));
    expect(res.status).toBe(401);
  });

  it("rejects an empty POST body", async () => {
    const res = await POST(makeRequest("POST", { token: "good-token", body: {} }));
    expect(res.status).toBe(400);
  });
});

describe("/api/v1/epk/share — owner-scoped behavior", () => {
  it("returns the owner's share settings, scoped to their user id", async () => {
    singleResult = {
      data: { epk_share_token: "tok-abc", epk_bio: "Bio text", epk_contact: "book@example.com" },
      error: null,
    };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ token: "tok-abc", bio: "Bio text", contact: "book@example.com", persisted: true });
    expect(lastEqArgs).toEqual(["id", USER_ID]);
  });

  it("returns a null token when the artist has no profile row yet", async () => {
    singleResult = { data: null, error: null };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.token).toBeNull();
    expect(json.persisted).toBe(true);
  });

  it("regenerates a fresh token on POST", async () => {
    listResult = {
      data: [{ epk_share_token: "brand-new-token", epk_bio: "", epk_contact: "" }],
      error: null,
    };
    const res = await POST(makeRequest("POST", { token: "good-token", body: { regenerate: true } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.token).toBe("brand-new-token");
  });

  it("revokes the token on DELETE", async () => {
    listResult = {
      data: [{ epk_share_token: null, epk_bio: "Bio", epk_contact: "" }],
      error: null,
    };
    const res = await DELETE(makeRequest("DELETE", { token: "good-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.token).toBeNull();
  });

  it("falls back gracefully before PATCH 005 (columns missing)", async () => {
    singleResult = {
      data: null,
      error: { code: "42703", message: "column profiles.epk_share_token does not exist" },
    };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ token: null, bio: "", contact: "", persisted: false });
  });
});
