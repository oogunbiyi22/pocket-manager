import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Radio submission tracking: auth boundary + the graceful pre-migration
// fallback (PATCH 006 not run yet → GET reports persisted: false and the
// page keeps its localStorage state).

const USER_ID = "11111111-1111-4111-8111-111111111111";
const STATION_ID = "33333333-3333-4333-8333-333333333333";

let tableResult: { data: unknown; error: unknown } = { data: [], error: null };

function makeChain() {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "delete", "eq", "not", "order", "limit"]) {
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

import { GET, POST } from "./route";

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

function makeRequest(method: string, opts: { token?: string; body?: unknown } = {}) {
  return new NextRequest("http://localhost/api/v1/radio", {
    method,
    headers: {
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
}

describe("/api/v1/radio", () => {
  it("GET rejects unauthenticated requests", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("GET falls back gracefully before PATCH 006 runs", async () => {
    tableResult = { data: null, error: { code: "42703", message: 'column "station_name" does not exist' } };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ submissions: [], persisted: false });
  });

  it("POST rejects an unknown status", async () => {
    const res = await POST(makeRequest("POST", {
      token: "good-token",
      body: { stationId: STATION_ID, stationName: "KEXP", status: "bogus", songsSubmitted: [] },
    }));
    expect(res.status).toBe(400);
  });

  it("POST upserts a submission for a seeded (uuid) station", async () => {
    // lookup finds nothing, insert returns the saved row via the chain.
    tableResult = {
      data: [{
        id: "44444444-4444-4444-8444-444444444444",
        station_id: STATION_ID,
        station_name: "KEXP 90.3",
        song_title: "My Song",
        songs_submitted: ["My Song"],
        status: "submitted",
        submitted_at: "2026-10-29T00:00:00Z",
        updated_at: "2026-10-29T00:00:00Z",
      }],
      error: null,
    };
    const res = await POST(makeRequest("POST", {
      token: "good-token",
      body: { stationId: STATION_ID, stationName: "KEXP 90.3", status: "submitted", songsSubmitted: ["My Song"] },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.persisted).toBe(true);
    expect(body.submission).toMatchObject({ stationId: STATION_ID, status: "submitted", songsSubmitted: ["My Song"] });
  });
});
