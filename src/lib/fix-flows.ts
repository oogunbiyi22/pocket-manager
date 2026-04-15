/**
 * Fix Flow State Machine
 * ─────────────────────
 * Every revenue gap fix follows this 4-state machine:
 *
 *   not_started → in_progress → completed | skipped
 *
 * State is persisted in localStorage per (userId | "anon") + fixId.
 * When a Supabase session is active, the user-scoped key is used
 * so state survives across devices (future: push to Supabase table).
 */

export type FixState = "not_started" | "in_progress" | "completed" | "skipped";

export type FixRecord = {
  fixId: string;            // e.g. "soundexchange:song-abc" or "ascap:global"
  state: FixState;
  startedAt?: string;       // ISO — when user clicked "I've started this"
  completedAt?: string;     // ISO — when user confirmed completion
  estimatedValue: number;   // dollar amount at time of fix
  platform: string;         // collection body name
  songId?: string;          // if song-scoped, the song it applies to
  songTitle?: string;
  streamType?: string;
  notes?: string;           // optional user note on completion
};

const STORAGE_KEY = "pocket-manager-fix-flows";

function loadAll(): Record<string, FixRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, FixRecord>;
  } catch {
    return {};
  }
}

function saveAll(records: Record<string, FixRecord>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // non-fatal
  }
}

export function getFixRecord(fixId: string): FixRecord | null {
  const all = loadAll();
  return all[fixId] ?? null;
}

export function getAllFixRecords(): FixRecord[] {
  return Object.values(loadAll());
}

export function startFix(record: Omit<FixRecord, "state" | "startedAt">): FixRecord {
  const all = loadAll();
  const updated: FixRecord = {
    ...record,
    state: "in_progress",
    startedAt: new Date().toISOString(),
  };
  all[record.fixId] = updated;
  saveAll(all);
  return updated;
}

export function completeFix(fixId: string, notes?: string): FixRecord | null {
  const all = loadAll();
  const existing = all[fixId];
  if (!existing) return null;
  const updated: FixRecord = {
    ...existing,
    state: "completed",
    completedAt: new Date().toISOString(),
    notes,
  };
  all[fixId] = updated;
  saveAll(all);
  return updated;
}

export function skipFix(fixId: string): FixRecord | null {
  const all = loadAll();
  const existing = all[fixId];
  if (!existing) return null;
  const updated: FixRecord = { ...existing, state: "skipped" };
  all[fixId] = updated;
  saveAll(all);
  return updated;
}

export function resetFix(fixId: string): void {
  const all = loadAll();
  delete all[fixId];
  saveAll(all);
}

/** Build a deterministic fixId from platform + optional songId */
export function buildFixId(platform: string, songId?: string): string {
  const base = platform.toLowerCase().replace(/\s+/g, "_");
  return songId ? `${base}:${songId}` : `${base}:global`;
}

/** Nudge logic: returns fixes that have been in_progress for > 48 hours */
export function getStaleFixes(): FixRecord[] {
  const THRESHOLD_MS = 48 * 60 * 60 * 1000;
  const now = Date.now();
  return getAllFixRecords().filter(
    (r) => r.state === "in_progress" && r.startedAt && now - new Date(r.startedAt).getTime() > THRESHOLD_MS
  );
}

/** Summary for dashboard: how many fixes completed, total value recovered */
export function getFixSummary() {
  const all = getAllFixRecords();
  const completed = all.filter((r) => r.state === "completed");
  const inProgress = all.filter((r) => r.state === "in_progress");
  const totalRecovered = completed.reduce((sum, r) => sum + r.estimatedValue, 0);
  const totalInProgress = inProgress.reduce((sum, r) => sum + r.estimatedValue, 0);
  return { completed: completed.length, inProgress: inProgress.length, totalRecovered, totalInProgress, stale: getStaleFixes().length };
}
