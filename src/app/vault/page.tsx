"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import type { SongCatalogItem, SongVaultAssetKind } from "@/lib/backstage-data";

type AssetDef = { key: SongVaultAssetKind; label: string; hint: string; critical: boolean };

const ASSET_TYPES: AssetDef[] = [
  { key: "master", label: "Master", hint: "High-quality WAV or AIFF of the final mix", critical: true },
  { key: "artwork", label: "Artwork", hint: "3000×3000 JPG/PNG, DSP-ready", critical: true },
  { key: "split", label: "Split sheet", hint: "Signed ownership breakdown with all collaborators", critical: true },
  { key: "contract", label: "Contract", hint: "Distribution or label agreement", critical: false },
];

function assetStatus(song: SongCatalogItem, key: string): "present" | "missing" {
  return song.assets?.some((asset) => asset.kind === key) ? "present" : "missing";
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

        {/* Header */}
        <section className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-6 py-7 text-white" style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 320, height: 200, background: "radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30" style={{ fontFamily: "monospace", marginBottom: 12 }}>The Vault</div>
          <h2 className="text-[clamp(22px,4vw,32px)] font-light tracking-[-0.03em] text-white leading-tight mb-3">
            The files your career depends on.
          </h2>
          <p className="text-[13px] leading-[1.7] text-white/40 max-w-[480px] mb-5">
            Masters, artwork, split sheets, and contracts — tracked per song. Mark each as filed when you have it. Upload real files from inside any song room.
          </p>
          <div className="flex gap-5 flex-wrap">
            {songs.length > 0 ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(59,109,17,0.12)", border: "0.5px solid rgba(59,109,17,0.25)" }}>
                  <span className="size-1.5 rounded-full bg-[#97c459]" style={{ boxShadow: "0 0 6px #97c459" }} />
                  <span className="text-[13px] text-white/70"><strong className="text-[#97c459]">{presentCount}</strong> filed</span>
                </div>
                {missingCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(163,45,45,0.1)", border: "0.5px solid rgba(163,45,45,0.25)" }}>
                    <span className="size-1.5 rounded-full bg-[#e24b4a]" style={{ boxShadow: "0 0 6px #e24b4a" }} />
                    <span className="text-[13px] text-white/70"><strong className="text-[#e24b4a]">{missingCount}</strong> missing</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-[13px] text-white/30">Add releases to start tracking assets.</span>
            )}
          </div>
        </section>

        {/* Per-song asset rows */}
        {songs.length === 0 ? (
          <section className="rounded-[20px] glass card-shadow p-12 text-center">
            <div className="text-3xl mb-4">🗄️</div>
            <div className="text-[15px] font-medium text-[var(--text-primary)] mb-2">No releases yet</div>
            <p className="text-[13px] text-[var(--text-muted)] mb-6">Add your first song to start tracking masters, artwork, and split sheets.</p>
            <Link href="/projects/new" className="inline-block rounded-xl bg-[var(--bg-dark)] px-6 py-3 text-sm font-medium text-white">
              Add release →
            </Link>
          </section>
        ) : (
          <div className="space-y-3">
            {songs.map((song) => {
              const statuses = ASSET_TYPES.map((a) => ({ asset: a, status: assetStatus(song, a.key) }));
              const songMissing = statuses.filter((s) => s.status === "missing").length;
              return (
                <section key={song.id} className="rounded-[20px] glass card-shadow overflow-hidden">
                  {/* Song header */}
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/8">
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium text-[var(--text-primary)] truncate">{song.title}</div>
                      <div className="text-[11px] text-white/50 mt-0.5">{song.isrc || "No ISRC"}{song.releaseDate ? ` · ${song.releaseDate}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {songMissing > 0 ? (
                        <span className="rounded-full bg-[#f05c5c]/10 px-3 py-1 text-[11px] font-medium text-[#f05c5c]">{songMissing} missing</span>
                      ) : (
                        <span className="rounded-full bg-[#5fcf7e]/10 px-3 py-1 text-[11px] font-medium text-[#5fcf7e]">All filed ✓</span>
                      )}
                      <Link href={`/projects/${song.id}`} className="text-[11px] text-white/50 hover:text-white/90 transition">
                        Open →
                      </Link>
                    </div>
                  </div>

                  {/* Asset rows */}
                  <div className="divide-y divide-black/[0.05]">
                    {statuses.map(({ asset, status }) => {
                      return (
                        <div key={asset.key} className="flex items-center gap-3 px-5 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-[var(--text-primary)]">{asset.label}</span>
                              {asset.critical && <span className="text-[9px] font-semibold uppercase tracking-wider text-[#f0a832] bg-[#faeeda] px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <div className="text-[11px] text-white/50 mt-0.5">{asset.hint}</div>
                          </div>
                          {status === "present" ? (
                            <span className="shrink-0 rounded-full bg-[#5fcf7e]/10 px-3 py-1 text-[10px] font-semibold text-[#5fcf7e]" style={{ border: "0.5px solid rgba(59,109,17,0.2)" }}>
                              Filed ✓
                            </span>
                          ) : (
                            <Link
                              href={`/projects/${song.id}`}
                              className="shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold transition"
                              style={{ background: "#fcebeb", color: "#a32d2d", border: "0.5px solid rgba(163,45,45,0.2)" }}
                            >
                              Upload in room →
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* What belongs here */}
        <section className="rounded-[20px] glass card-shadow px-5 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-4">What belongs here</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Master WAV / stems", icon: "🎛️", hint: "Your final mix at full quality" },
              { label: "Split sheets", icon: "📄", hint: "Signed ownership breakdown" },
              { label: "Artwork (3000×3000)", icon: "🖼️", hint: "DSP-ready cover art" },
              { label: "Distribution contracts", icon: "📋", hint: "DistroKid, TuneCore, etc." },
              { label: "PRO registrations", icon: "✅", hint: "ASCAP, BMI, SESAC" },
              { label: "Press photos / EPK", icon: "📸", hint: "High-res promo assets" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.03)", border: "0.5px solid rgba(0,0,0,0.06)" }}>
                <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-[13px] font-medium text-[var(--text-primary)]">{item.label}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.hint}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-white/50">
            Open any song room to upload and track real files. Vault status now reflects actual room assets instead of manual checkoffs.
          </p>
        </section>

      </main>
    </AppShell>
  );
}
