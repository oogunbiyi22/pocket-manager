import { describe, it, expect } from "vitest";
import { resolveAppRedirectUrl, resolveAppOrigin, isAppOrigin } from "./checkout-urls";

const FALLBACK = "https://pocketmanager.online/billing?checkout=complete";

describe("resolveAppRedirectUrl", () => {
  it("honors a URL on the app's own origin", () => {
    expect(resolveAppRedirectUrl("https://pocketmanager.online/billing?checkout=complete", FALLBACK))
      .toBe("https://pocketmanager.online/billing?checkout=complete");
  });

  it("honors the Vercel preview origin and localhost dev origin", () => {
    expect(resolveAppRedirectUrl("https://pocketmanager.vercel.app/billing", FALLBACK))
      .toBe("https://pocketmanager.vercel.app/billing");
    expect(resolveAppRedirectUrl("http://localhost:3000/billing", FALLBACK))
      .toBe("http://localhost:3000/billing");
  });

  it("rejects an arbitrary external origin", () => {
    expect(resolveAppRedirectUrl("https://evil.example.com/phish", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects look-alike subdomain spoofs", () => {
    expect(resolveAppRedirectUrl("https://pocketmanager.online.evil.com/billing", FALLBACK)).toBe(FALLBACK);
    expect(resolveAppRedirectUrl("https://evil-pocketmanager.online/billing", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects non-http schemes and unparseable values", () => {
    expect(resolveAppRedirectUrl("javascript:alert(1)", FALLBACK)).toBe(FALLBACK);
    expect(resolveAppRedirectUrl("data:text/html,<script>1</script>", FALLBACK)).toBe(FALLBACK);
    expect(resolveAppRedirectUrl("not a url", FALLBACK)).toBe(FALLBACK);
    expect(resolveAppRedirectUrl("/billing", FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when no candidate is supplied", () => {
    expect(resolveAppRedirectUrl(undefined, FALLBACK)).toBe(FALLBACK);
    expect(resolveAppRedirectUrl(null, FALLBACK)).toBe(FALLBACK);
    expect(resolveAppRedirectUrl("", FALLBACK)).toBe(FALLBACK);
  });
});

describe("resolveAppOrigin / isAppOrigin", () => {
  it("accepts known app origins only", () => {
    expect(isAppOrigin("https://pocketmanager.online")).toBe(true);
    expect(isAppOrigin("https://pocketmanager.online.evil.com")).toBe(false);
    expect(resolveAppOrigin("http://localhost:3000")).toBe("http://localhost:3000");
    expect(resolveAppOrigin("https://evil.example.com")).toBe("https://pocketmanager.online");
    expect(resolveAppOrigin(null)).toBe("https://pocketmanager.online");
  });
});
