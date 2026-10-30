/**
 * Pocket captures — shared model + vault storage helpers.
 *
 * Captures live in localStorage (the capture inbox is device-local by
 * design), but file-type captures (voice memo / file / photo) hold a real
 * `SongVaultAsset` whose bytes sit in the vault-assets bucket. The capture
 * item is just the index card; the asset is the thing itself.
 */

import type { SongVaultAsset, SongVaultAssetKind } from "@/lib/backstage-data";
import { getAuthHeaders } from "@/lib/supabase";

export const CAPTURE_STORAGE_KEY = "pocket-manager-captures";

/** Reserved upload folder for captures that aren't routed to a specific song. */
export const CAPTURE_FOLDER = "captures";

export type PocketItemType = "Voice memo" | "File" | "Note" | "Task" | "Link" | "Photo";

export type PocketItem = {
  id: string;
  type: PocketItemType;
  body: string;
  songId: string;
  createdAt: string;
  /** The real stored file for Voice memo / File / Photo captures. */
  asset?: SongVaultAsset;
};

export function loadCaptures(): PocketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CAPTURE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PocketItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCaptures(items: PocketItem[]) {
  try {
    window.localStorage.setItem(CAPTURE_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable — the in-memory list still works */
  }
}

/**
 * Upload a capture file to vault storage. `songId` is the routed song, or
 * CAPTURE_FOLDER for inbox/vault-routed captures. Returns the stored asset
 * metadata, or null when the upload couldn't happen (signed out, storage
 * not configured, network) — callers must treat null as "not saved", never
 * fall back to a text-only fake.
 */
export async function uploadCaptureFile(
  file: Blob,
  fileName: string,
  songId: string,
  kind: SongVaultAssetKind,
): Promise<SongVaultAsset | null> {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return null;

  const formData = new FormData();
  formData.set("songId", songId);
  formData.set("kind", kind);
  const named = file instanceof File && file.name === fileName
    ? file
    : new File([file], fileName, { type: file.type || "application/octet-stream" });
  formData.append("files", named);

  try {
    const res = await fetch("/api/v1/assets", {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const asset = (data.assets as SongVaultAsset[] | undefined)?.[0];
    return asset ?? null;
  } catch {
    return null;
  }
}

/** Short-lived signed URL for playing/opening a stored capture asset. */
export async function fetchCaptureAssetUrl(storagePath: string, download = false): Promise<string | null> {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return null;
  try {
    const params = new URLSearchParams({ path: storagePath });
    if (download) params.set("download", "1");
    const res = await fetch(`/api/v1/assets?${params.toString()}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.url === "string" ? data.url : null;
  } catch {
    return null;
  }
}
