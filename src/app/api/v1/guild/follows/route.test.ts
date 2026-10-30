import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Guild follows: auth boundary + the graceful pre-migration fallback
// (PATCH 006 not run yet → GET reports persisted: false, page keeps its
// localStorage state instead of crashing).

const USER_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";

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
  return new NextRequest("http://localhost/api/v1/guild/follows", {
    method,
    headers: {
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
}

describe("/api/v1/guild/follows", () => {
  it("GET rejects unauthenticated requests", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("GET falls back gracefully before PATCH 006 runs", async () => {
    tableResult = { data: null, error: { code: "42P01", message: 'relation "guild_follows" does not exist' } };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ following: [], persisted: false });
  });

  it("GET returns the user's followed ids when storage is ready", async () => {
    tableResult = { data: [{ followed_id: MEMBER_ID }], error: null };
    const res = await GET(makeRequest("GET", { token: "good-token" }));
    const body = await res.json();
    expect(body).toEqual({ following: [MEMBER_ID], persisted: true });
  });

  it("POST rejects following yourself", async () => {
    const res = await POST(makeRequest("POST", { token: "good-token", body: { memberId: USER_ID } }));
    expect(res.status).toBe(400);
  });

  it("POST records a follow", async () => {
    tableResult = { data: null, error: null };
    const res = await POST(makeRequest("POST", { token: "good-token", body: { memberId: MEMBER_ID } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ following: true, persisted: true });
  });
});
