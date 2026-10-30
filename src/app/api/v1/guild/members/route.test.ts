import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// The guild members directory used to be unauthenticated — these tests
// lock in that member data is only served to signed-in users.

const USER_ID = "11111111-1111-4111-8111-111111111111";

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

import { GET } from "./route";

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

function makeRequest(token?: string) {
  return new NextRequest("http://localhost/api/v1/guild/members", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe("GET /api/v1/guild/members", () => {
  it("rejects requests with no token", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("rejects requests with an invalid token", async () => {
    const res = await GET(makeRequest("bad-token"));
    expect(res.status).toBe(401);
  });

  it("serves mapped members to a signed-in user", async () => {
    tableResult = {
      data: [{
        id: "22222222-2222-4222-8222-222222222222",
        artist_name: "Test Artist",
        role: "Producer",
        vibe: "R&B",
        plan: "pro",
        created_at: "2026-01-01T00:00:00Z",
      }],
      error: null,
    };
    const res = await GET(makeRequest("good-token"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configured).toBe(true);
    expect(body.members).toHaveLength(1);
    expect(body.members[0]).toMatchObject({ artistName: "Test Artist", role: "Producer", plan: "pro" });
  });
});
