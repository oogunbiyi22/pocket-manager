import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────
// The beats route's security boundary is the same shape as the catalog
// route's: a Bearer token is resolved to a Supabase user, and every query is
// scoped to that user. These tests lock in the auth/validation posture and
// the graceful pre-migration fallback (table not created yet → no crash).

const USER_ID = "11111111-1111-4111-8111-111111111111";

// What the (fake) beat_licenses table returns for the current test.
let tableResult: { data: unknown; error: unknown } = { data: [], error: null };

function makeChain() {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(tableResult));
  chain.maybeSingle = vi.fn(() => Promise.resolve(tableResult));
  chain.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(tableResult).then(onFulfilled, onRejected);
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
  tableResult = { data: [], error: null };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(method: string, opts: { token?: string; body?: unknown; url?: string } = {}) {
  return new NextRequest(opts.url ?? "https://pocketmanager.online/api/v1/beats", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

const VALID_LICENSE = {
  songId: "song-1",
  buyer: "Test Buyer",
  type: "lease",
  amount: 150,
  date: "2026-10-01",
  expires: "",
};

describe("/api/v1/beats — auth", () => {
  it("rejects GET without a token", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("rejects POST without a token", async () => {
    const res = await POST(makeRequest("POST", { body: VALID_LICENSE }));
    expect(res.status).toBe(401);
  });

  it("rejects an invalid session token", async () => {
    const res = await GET(makeRequest("GET", { token: "bad-token" }));
    expect(res.status).toBe(401);
  });
});

describe("/api/v1/beats — validation", () => {
  it("rejects a create with a missing buyer", async () => {
    const res = await POST(
      makeRequest("POST", { token: "good-token", body: { ...VALID_LICENSE, buyer: "  " } }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a create with an unknown license type", async () => {
    const res = await POST(
      makeRequest("POST", { token: "good-token", body: { ...VALID_LICENSE, type: "sync" } }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects DELETE without a valid id", async () => {
    const res = await DELETE(makeRequest("DELETE", { token: "good-token" }));
    expect(res.status).toBe(400);
  });
});

describe("/api/v1/beats — persistence behavior", () => {
  it("creates a license and returns it in page shape", async () => {
    tableResult = {
      data: {
        id: "22222222-2222-4222-8222-222222222222",
        song_id: "song-1",
        buyer: "Test Buyer",
        license_type: "lease",
        amount: "150.00",
        license_date: "2026-10-01",
        expires: null,
      },
      error: null,
    };
    const res = await POST(makeRequest("POST", { token: "good-token", body: VALID_LICENSE }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.persisted).toBe(true);
    expect(json.license).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      songId: "song-1",
      buyer: "Test Buyer",
      type: "lease",
      amount: 150,
      date: "2026-10-01",
      expires: "",
    });
  });

  it("falls back gracefully when the table doesn't exist yet", async () => {
    tableResult = {
      data: null,
      error: { code: "PGRST205", message: "Could not find the table 'public.beat_licenses' in the schema cache" },
    };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ licenses: [], persisted: false });
  });
});
