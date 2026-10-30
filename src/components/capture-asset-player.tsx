"use client";

/**
 * Playback/open control for a stored capture asset. The asset bytes live in
 * vault storage behind signed URLs, so the URL is fetched on demand when
 * the artist actually presses play/open — nothing here fabricates a local
 * copy.
 */

import { useState } from "react";
import type { SongVaultAsset } from "@/lib/backstage-data";
import { fetchCaptureAssetUrl } from "@/lib/captures";

export function CaptureAssetPlayer({ asset, compact = false }: { asset: SongVaultAsset; compact?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const isAudio = asset.mimeType.startsWith("audio/") || asset.kind === "memo";

  async function load() {
    setLoading(true);
    setFailed(false);
    const signed = await fetchCaptureAssetUrl(asset.storagePath ?? "");
    setLoading(false);
    if (signed) setUrl(signed);
    else setFailed(true);
  }

  if (!asset.storagePath) return null;

  if (url && isAudio) {
    return <audio controls autoPlay src={url} className={compact ? "h-9 w-full max-w-[220px]" : "h-10 w-full max-w-sm"} />;
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-lg border-[0.5px] border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/5"
      >
        Open file ↗
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void load()}
      disabled={loading}
      className="inline-flex rounded-lg border-[0.5px] border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/5 disabled:opacity-50"
    >
      {loading ? "Loading…" : failed ? "Couldn't load — retry" : isAudio ? "▶ Play memo" : "Open file"}
    </button>
  );
}
