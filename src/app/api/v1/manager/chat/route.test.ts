import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────
// The chat route's trust boundary: the plan (which picks the model rail)
// must come from the caller's stored Supabase profile — never from the
// request body. These tests lock that in: a body claiming "elite" must
// not buy the Claude rail, and a stored elite profile must get it even
// when the body says "free".

const USER_ID = "22222222-2222-4222-8222-222222222222";

// Assembled at runtime: a credential-shaped literal in this file gets
// redacted by tooling in transit and corrupts the source.
const GOOD_TOKEN = ["good", "token"].join("-");
const BAD_TOKEN = ["bad", "token"].join("-");

// The plan stored on the fake profiles row for the current test.
let profilePlan: unknown = "free";

function makeChain() {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: { plan: profilePlan }, error: null }),
  );
  return chain;
}

const getUserMock = vi.fn((token: string) =>
  token === GOOD_TOKEN
    ? Promise.resolve({ data: { user: { id: USER_ID } }, error: null })
    : Promise.resolve({ data: { user: null }, error: { message: "invalid token" } }),
);

const { streamTextMock } = vi.hoisted(() => ({
  streamTextMock: vi.fn(() => ({
    toTextStreamResponse: () => new Response("stream-ok", { status: 200 }),
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn((_url: string, key: string) =>
    key === "fake-service-role-key"
      ? { from: vi.fn(() => makeChain()) }
      : { auth: { getUser: getUserMock } },
  ),
}));

vi.mock("ai", () => ({ streamText: streamTextMock }));

// Provider factories return a taggable fake model so tests can assert
// exactly which rail was selected.
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => (modelId: string) => ({ provider: "google", modelId })),
}));
vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => (modelId: string) => ({ provider: "anthropic", modelId })),
}));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => (modelId: string) => ({ provider: "openrouter", modelId })),
}));

import { POST } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";
  process.env.ANTHROPIC_API_KEY = "fake-anthropic-key";
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_MODEL;
  delete process.env.ELITE_AI_MODEL;
  profilePlan = "free";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(opts: { token?: string; body?: unknown } = {}) {
  return new NextRequest("https://pocketmanager.online/api/v1/manager/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: JSON.stringify(
      opts.body ?? { messages: [{ role: "user", content: "What should I do next?" }] },
    ),
  });
}

function lastStreamCall() {
  const calls = streamTextMock.mock.calls as unknown as Array<
    [{ model: { provider: string; modelId: string }; system: string }]
  >;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][0];
}

describe("/api/v1/manager/chat — plan is derived server-side", () => {
  it("anonymous caller claiming elite in the body stays on the free rail", async () => {
    const res = await POST(
      makeRequest({
        body: { messages: [{ role: "user", content: "hi" }], plan: "elite" },
      }),
    );
    expect(res.status).toBe(200);
    const call = lastStreamCall();
    expect(call.model).toEqual({ provider: "google", modelId: "gemini-2.0-flash" });
    expect(call.system).toContain("Plan: free.");
  });

  it("free-profile user claiming elite in the body stays on the free rail", async () => {
    profilePlan = "free";
    const res = await POST(
      makeRequest({
        token: GOOD_TOKEN,
        body: { messages: [{ role: "user", content: "hi" }], plan: "elite" },
      }),
    );
    expect(res.status).toBe(200);
    const call = lastStreamCall();
    expect(call.model).toEqual({ provider: "google", modelId: "gemini-2.0-flash" });
    expect(call.system).toContain("Plan: free.");
  });

  it("elite-profile user gets the Claude rail even when the body says free", async () => {
    profilePlan = "elite";
    const res = await POST(
      makeRequest({
        token: GOOD_TOKEN,
        body: { messages: [{ role: "user", content: "hi" }], plan: "free" },
      }),
    );
    expect(res.status).toBe(200);
    const call = lastStreamCall();
    expect(call.model).toEqual({ provider: "anthropic", modelId: "claude-sonnet-4-6" });
    expect(call.system).toContain("Plan: elite.");
  });

  it("pro-profile user runs the pro context on the Gemini rail", async () => {
    profilePlan = "pro";
    const res = await POST(makeRequest({ token: GOOD_TOKEN }));
    expect(res.status).toBe(200);
    const call = lastStreamCall();
    expect(call.model).toEqual({ provider: "google", modelId: "gemini-2.0-flash" });
    expect(call.system).toContain("Plan: pro.");
  });

  it("invalid token falls back to free even with a stored elite row", async () => {
    profilePlan = "elite";
    const res = await POST(
      makeRequest({
        token: BAD_TOKEN,
        body: { messages: [{ role: "user", content: "hi" }], plan: "elite" },
      }),
    );
    expect(res.status).toBe(200);
    const call = lastStreamCall();
    expect(call.model).toEqual({ provider: "google", modelId: "gemini-2.0-flash" });
    expect(call.system).toContain("Plan: free.");
  });
});
