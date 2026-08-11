"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getSongReadinessScore } from "@/lib/backstage-data";
import type { SongCatalogItem, SongVaultAssetKind } from "@/lib/backstage-data";

function ReadinessRing({ score }: { score: number }) {
  const r = 12;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#97c459" : score >= 40 ? "#ef9f27" : "#e24b4a";
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${fill} ${circ}`} transform="rotate(-90 14 14)" />
      <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="600" fill={color}>{score}</text>
    </svg>
  );
}

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
    <AppShell title="" eyebrow="">
      <main className="mx-auto max-w-4xl space-y-4">

        <header className="flex items-center justify-between px-1 pt-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Vault</div>
            <div className="text-[15px] text-white/90">
              {songs.length > 0
                ? `${presentCount} filed · ${missingCount > 0 ? `${missingCount} missing` : "all clear"}`
                : "The release package"}
            </div>
          </div>
          <Link href="/projects" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 press">
            Rooms →
          </Link>
        </header>

        {/* Per-song asset rows */}
        {songs.length === 0 ? (
          <section className="rounded-[20px] glass card-shadow p-12 text-center">
            <div className="text-3xl mb-4">🗄️</div>
            <div className="text-[15px] font-medium text-[var(--text-primary)] mb-2">No release rooms yet</div>
            <p className="text-[13px] text-[var(--text-muted)] mb-6">Add your first release, open the room, then start locking in masters, artwork, and split sheets.</p>
            <Link href="/projects/new" className="inline-block rounded-xl bg-[var(--bg-dark)] px-6 py-3 text-sm font-medium text-white">
              Open first room →
            </Link>
          </section>
        ) : (
          <div className="space-y-3">
            {songs.map((song) => {
              const statuses = ASSET_TYPES.map((a) => ({ asset: a, status: assetStatus(song, a.key) }));
              const songMissing = statuses.filter((s) => s.status === "missing").length;
              const readiness = getSongReadinessScore(song);
              return (
                <section key={song.id} className="rounded-[20px] glass card-shadow overflow-hidden">
                  {/* Song header */}
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/8">
                    <div className="flex items-center gap-3 min-w-0">
                      <ReadinessRing score={readiness} />
                      <div className="min-w-0">
                        <div className="text-[15px] font-medium text-[var(--text-primary)] truncate">{song.title}</div>
                        <div className="text-[11px] text-white/50 mt-0.5">{song.isrc || "No ISRC"}{song.releaseDate ? ` · ${song.releaseDate}` : ""}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {songMissing > 0 ? (
                        <span className="rounded-full bg-[#f05c5c]/10 px-3 py-1 text-[11px] font-medium text-[#f05c5c]">{songMissing} missing</span>
                      ) : (
                        <span className="rounded-full bg-[#97c459]/10 px-3 py-1 text-[11px] font-medium text-[#97c459]">All filed ✓</span>
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
                              {asset.critical && <span className="text-[9px] font-semibold uppercase tracking-wider text-[#ef9f27] bg-[#ef9f27]/10 border border-[#ef9f27]/20 px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <div className="text-[11px] text-white/50 mt-0.5">{asset.hint}</div>
                          </div>
                          {status === "present" ? (
                            <span className="shrink-0 rounded-full bg-[#97c459]/10 px-3 py-1 text-[10px] font-semibold text-[#97c459]" style={{ border: "0.5px solid rgba(59,109,17,0.2)" }}>
                              Filed ✓
                            </span>
                          ) : (
                            <Link
                              href={`/projects/${song.id}#files-panel`}
                              className="shrink-0 rounded-full border border-[#f05c5c]/30 bg-[#f05c5c]/10 px-3 py-1 text-[10px] font-semibold text-[#f05c5c] transition hover:bg-[#f05c5c]/20"
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
              <div key={item.label} className="flex items-start gap-3 rounded-xl border-[0.5px] border-white/8 bg-white/[0.03] p-3">
                <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-[13px] font-medium text-[var(--text-primary)]">{item.label}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.hint}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-white/50">
            Open any release room to upload and track real files. Vault status now reflects actual room assets instead of manual checkoffs.
          </p>
        </section>

      </main>
    </AppShell>
  );
}
