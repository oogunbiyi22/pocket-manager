import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────
// Stripe.webhooks.constructEvent is the security boundary: it's the only thing
// standing between "anyone who finds this URL" and "can grant themselves a
// paid plan". These tests exist to make sure that boundary can't regress
// silently in a future refactor.

const constructEventMock = vi.fn();
vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      webhooks = { constructEvent: constructEventMock };
      subscriptions = { retrieve: vi.fn() };
      constructor(_key: string, _opts: unknown) {}
    },
  };
});

const updateMock = vi.fn();
const eqMock = vi.fn(() => Promise.resolve({ error: null }));
const fromMock = vi.fn(() => ({ update: updateMock }));
updateMock.mockImplementation(() => ({ eq: eqMock }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: fromMock })),
}));

async function importRoute() {
  // Fresh import per test so module-level env reads pick up our mutations.
  vi.resetModules();
  return await import("./route");
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(body: string, signature = "t=1,v1=fake") {
  return new NextRequest("https://pocketmanager.online/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": signature },
  });
}

describe("POST /api/stripe/webhook — security posture", () => {
  it("rejects (500) when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { POST } = await importRoute();
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(500);
  });

  it("fails closed (500) when STRIPE_WEBHOOK_SECRET is missing — must never silently accept unsigned events", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const { POST } = await importRoute();
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/webhook secret/i);
  });

  it("rejects (400) a request with an invalid/forged signature", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });
    const { POST } = await importRoute();
    const res = await POST(makeRequest("{}", "bad-signature"));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/stripe/webhook — checkout.session.completed", () => {
  it("upgrades the correct user's plan using client_reference_id, never trusting client-supplied fields blindly", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "user-123",
          metadata: { plan: "pro" },
          customer: "cus_abc",
          subscription: null,
        },
      },
    });

    const { POST } = await importRoute();
    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "pro", stripe_customer_id: "cus_abc" }),
    );
    expect(eqMock).toHaveBeenCalledWith("id", "user-123");
  });

  it("does not upgrade anyone when the session has no resolvable user id (avoids crediting the wrong account)", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { client_reference_id: null, metadata: {}, customer: "cus_abc" } },
    });

    const { POST } = await importRoute();
    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200); // acked to Stripe so it stops retrying
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/webhook — subscription lifecycle", () => {
  it("downgrades to free on customer.subscription.deleted", async () => {
    constructEventMock.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_abc" } },
    });

    const { POST } = await importRoute();
    await POST(makeRequest("{}"));

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "free" }),
    );
    expect(eqMock).toHaveBeenCalledWith("stripe_customer_id", "cus_abc");
  });

  it("only keeps the paid plan active for active/trialing statuses", async () => {
    constructEventMock.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_abc", status: "past_due", metadata: { plan: "pro" } } },
    });

    const { POST } = await importRoute();
    await POST(makeRequest("{}"));

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "free" }),
    );
  });
});
