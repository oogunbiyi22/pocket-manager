/**
 * Pitch send-state machine — the honesty layer for the Pitching Engine.
 *
 * A pitch's persisted status lives in `user_playlist_pitches.status`
 * (queued / opened / sent / replied / placed / declined). The send states
 * the artist actually controls are narrower:
 *
 *   draft          → the pitch exists but nothing has left the app
 *   opened-in-mail → the artist's mail client was opened with the pitch
 *                    (mailto fallback). The email may or may not have been
 *                    sent in the mail app — the app must NOT claim "sent".
 *   sent           → either the server actually delivered it (Resend), or
 *                    the artist explicitly marked it sent after the fact.
 *
 * Mapping to the persisted column:
 *   draft          ↔ "queued"  (the table's pre-send state)
 *   opened-in-mail ↔ "opened"  (set only by the mailto fallback path)
 *   sent           ↔ "sent"    (server-delivered, or user-confirmed)
 *
 * replied / placed / declined are downstream tracking states set outside
 * the send flow; for send purposes they all imply the pitch was sent.
 */

export const PITCH_DB_STATUSES = [
  "queued",
  "opened",
  "sent",
  "replied",
  "placed",
  "declined",
] as const;

export type PitchDbStatus = (typeof PITCH_DB_STATUSES)[number];

export type PitchSendState = "draft" | "opened-in-mail" | "sent";

export function isPitchDbStatus(value: string): value is PitchDbStatus {
  return (PITCH_DB_STATUSES as readonly string[]).includes(value);
}

/** The send state a persisted status represents. */
export function sendStateFromDbStatus(status: PitchDbStatus): PitchSendState {
  switch (status) {
    case "queued":
      return "draft";
    case "opened":
      return "opened-in-mail";
    default:
      return "sent";
  }
}

/** The persisted status for a send state the artist controls. */
export function dbStatusFromSendState(state: PitchSendState): PitchDbStatus {
  switch (state) {
    case "draft":
      return "queued";
    case "opened-in-mail":
      return "opened";
    case "sent":
      return "sent";
  }
}

const SEND_RANK: Record<PitchSendState, number> = {
  draft: 0,
  "opened-in-mail": 1,
  sent: 2,
};

const DOWNSTREAM_STATUSES: readonly PitchDbStatus[] = ["replied", "placed", "declined"];

/**
 * Send states only move forward: draft → opened-in-mail → sent.
 * A pitch can skip opened-in-mail when the server sends it directly
 * (draft → sent), but nothing ever moves backwards — and nothing reaches
 * "sent" implicitly: a transition to "sent" is only ever produced by the
 * server-delivered path or an explicit "mark as sent" action.
 * Downstream tracking states are reachable only once a pitch is sent.
 */
export function canTransitionSendState(from: PitchDbStatus, to: PitchDbStatus): boolean {
  if (from === to) return true;
  if (DOWNSTREAM_STATUSES.includes(to)) {
    return sendStateFromDbStatus(from) === "sent";
  }
  if (DOWNSTREAM_STATUSES.includes(from)) return false;
  return SEND_RANK[sendStateFromDbStatus(to)] > SEND_RANK[sendStateFromDbStatus(from)];
}
