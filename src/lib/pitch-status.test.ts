import { describe, it, expect } from "vitest";
import {
  sendStateFromDbStatus,
  dbStatusFromSendState,
  canTransitionSendState,
  isPitchDbStatus,
} from "./pitch-status";

describe("pitch status mapping", () => {
  it("maps persisted statuses to honest send states", () => {
    expect(sendStateFromDbStatus("queued")).toBe("draft");
    expect(sendStateFromDbStatus("opened")).toBe("opened-in-mail");
    expect(sendStateFromDbStatus("sent")).toBe("sent");
    // Downstream tracking states imply the pitch was sent.
    expect(sendStateFromDbStatus("replied")).toBe("sent");
    expect(sendStateFromDbStatus("placed")).toBe("sent");
    expect(sendStateFromDbStatus("declined")).toBe("sent");
  });

  it("maps send states back to persisted statuses", () => {
    expect(dbStatusFromSendState("draft")).toBe("queued");
    expect(dbStatusFromSendState("opened-in-mail")).toBe("opened");
    expect(dbStatusFromSendState("sent")).toBe("sent");
  });

  it("round-trips the artist-controlled states", () => {
    for (const state of ["draft", "opened-in-mail", "sent"] as const) {
      expect(sendStateFromDbStatus(dbStatusFromSendState(state))).toBe(state);
    }
  });

  it("recognizes only the table's statuses", () => {
    expect(isPitchDbStatus("queued")).toBe(true);
    expect(isPitchDbStatus("placed")).toBe(true);
    expect(isPitchDbStatus("ready")).toBe(false);
    expect(isPitchDbStatus("")).toBe(false);
  });
});

describe("pitch send-state transitions", () => {
  it("allows the forward path draft → opened-in-mail → sent", () => {
    expect(canTransitionSendState("queued", "opened")).toBe(true);
    expect(canTransitionSendState("opened", "sent")).toBe(true);
  });

  it("allows draft → sent for the server-delivered path", () => {
    expect(canTransitionSendState("queued", "sent")).toBe(true);
  });

  it("never moves a pitch backwards", () => {
    expect(canTransitionSendState("opened", "queued")).toBe(false);
    expect(canTransitionSendState("sent", "opened")).toBe(false);
    expect(canTransitionSendState("sent", "queued")).toBe(false);
  });

  it("treats same-state writes as no-ops, not errors", () => {
    expect(canTransitionSendState("queued", "queued")).toBe(true);
    expect(canTransitionSendState("sent", "sent")).toBe(true);
  });

  it("allows downstream tracking once a pitch is sent", () => {
    expect(canTransitionSendState("sent", "replied")).toBe(true);
    expect(canTransitionSendState("sent", "placed")).toBe(true);
    expect(canTransitionSendState("replied", "placed")).toBe(true);
  });

  it("does not allow downstream tracking before sending", () => {
    expect(canTransitionSendState("queued", "replied")).toBe(false);
    expect(canTransitionSendState("opened", "placed")).toBe(false);
  });
});
