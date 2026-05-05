"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import type { SongCatalogItem } from "@/lib/backstage-data";

type AssetDef = { key: string; label: string; critical: boolean };

const ASSET_TYPES: AssetDef[] = [
  { key: "master", label: "Master", critical: true },
  { key: "artwork", label: "Artwork", critical: true },
  { key: "split", label: "Split sheet", critical: true },
  { key: "contract", label: "Contract", critical: false },
];

function assetStatus(song: SongCatalogItem, key: string): "present" | "missing" {
  return song.assets?.some((asset) => asset.kind === key) ? "present" : "missing";
}

function StatusPill({ status }: { status: "present" | "missing" }) {
  if (status === "present") {
    return (
      <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#3b6d11", background: "#eaf3de", border: "0.5px solid rgba(59,109,17,0.2)" }}>
        Filed
      </span>
    );
  }
  return (
    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#a32d2d", background: "#fcebeb", border: "0.5px solid rgba(163,45,45,0.2)" }}>
      Missing
    </span>
  );
}

export default function VaultPage() {
  const { songs } = usePocket();

  const totalAssets = songs.length * ASSET_TYPES.length;
  const missingCount = songs.reduce((acc, song) => {
    return acc + ASSET_TYPES.filter((a) => assetStatus(song, a.key) === "missing").length;
  }, 0);
  const presentCount = totalAssets - missingCount;

  return (
    <AppShell title="Vault" eyebrow="Where the work lives">
      <main className="mx-auto max-w-4xl space-y-4">

        {/* Header banner */}
        <section
          style={{
            borderRadius: 24,
            padding: "28px 28px 24px",
            background: "rgba(13,13,11,1)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, right: 0, width: 320, height: 200, background: "radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginBottom: 12 }}>The Vault</div>
          <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 200, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.2, marginBottom: 12 }}>
            The files your career depends on.
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.4)", maxWidth: 480, marginBottom: 20 }}>
            Masters, artwork, split sheets, and contracts — tracked by song, with clear status on what&apos;s filed and what&apos;s still missing.
          </p>

          {/* Status summary */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {songs.length > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: "rgba(59,109,17,0.12)", border: "0.5px solid rgba(59,109,17,0.25)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#97c459", boxShadow: "0 0 6px #97c459" }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <strong style={{ color: "#97c459" }}>{presentCount}</strong> filed
                  </span>
                </div>
                {missingCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: "rgba(163,45,45,0.1)", border: "0.5px solid rgba(163,45,45,0.25)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e24b4a", boxShadow: "0 0 6px #e24b4a" }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      <strong style={{ color: "#e24b4a" }}>{missingCount}</strong> missing
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                Add releases to start tracking your assets.
              </div>
            )}
          </div>
        </section>

        {/* Per-song asset grid */}
        {songs.length === 0 ? (
          <section
            style={{ borderRadius: 20, border: "0.5px dashed rgba(255,255,255,0.1)", padding: "48px 24px", textAlign: "center" }}
          >
            <div style={{ fontSize: 32, marginBottom: 16 }}>🗄️</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>No releases yet</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Add your first song to start tracking masters, artwork, and split sheets.</p>
            <Link
              href="/projects/new"
              style={{ display: "inline-block", padding: "10px 24px", borderRadius: 12, background: "var(--bg-dark)", color: "#fff", fontSize: 13, fontWeight: 500 }}
            >
              Add release →
            </Link>
          </section>
        ) : (
          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, 90px)", gap: 8, padding: "0 16px", marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>Song</div>
              {ASSET_TYPES.map((a) => (
                <div key={a.key} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "center" }}>{a.label}</div>
              ))}
            </div>

            {songs.map((song) => {
              const statuses = ASSET_TYPES.map((a) => assetStatus(song, a.key));
              const songMissing = statuses.filter((s) => s === "missing").length;
              const syncedCount = song.assets?.filter((asset) => asset.source === "supabase").length ?? 0;
              const localCount = song.assets?.filter((asset) => asset.source === "local").length ?? 0;
              return (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr repeat(4, 90px)",
                    gap: 8,
                    alignItems: "center",
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "var(--glass-bg, rgba(255,255,255,0.5))",
                    border: songMissing > 0 ? "0.5px solid rgba(163,45,45,0.15)" : "0.5px solid rgba(59,109,17,0.12)",
                    textDecoration: "none",
                    transition: "opacity 0.15s",
                  }}
                  className="press"
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {song.isrc ? `${song.isrc} · ` : ""}
                      {syncedCount > 0 ? `${syncedCount} synced` : "No synced files"}
                      {localCount > 0 ? ` · ${localCount} local-only` : ""}
                    </div>
                  </div>
                  {statuses.map((status, i) => (
                    <div key={ASSET_TYPES[i].key} style={{ display: "flex", justifyContent: "center" }}>
                      <StatusPill status={status} />
                    </div>
                  ))}
                </Link>
              );
            })}
          </section>
        )}

        {/* What belongs in the vault */}
        <section
          style={{ borderRadius: 20, padding: "20px 20px", background: "rgba(255,255,255,0.3)", border: "0.5px solid rgba(0,0,0,0.07)" }}
          className="glass"
        >
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>What belongs here</div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {[
              { label: "Master WAV / stems", icon: "🎛️" },
              { label: "Split sheets", icon: "📄" },
              { label: "Artwork (3000×3000)", icon: "🖼️" },
              { label: "Distribution contracts", icon: "📋" },
              { label: "PRO registrations", icon: "✅" },
              { label: "Press photos / EPK", icon: "📸" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(0,0,0,0.03)", border: "0.5px solid rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary, #514d47)" }}>{item.label}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Open any song room to upload and track real assets. Signed-in uploads can sync to Supabase storage when the vault bucket is configured.
          </p>
        </section>

      </main>
    </AppShell>
  );
}
