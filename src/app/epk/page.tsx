"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatMoney,
  getSongConfirmedIncome,
  getSongReadinessScore,
} from "@/lib/backstage-data";

export default function EpkPage() {
  const { profile, songs } = usePocket();
  const [selectedSongIds, setSelectedSongIds] = useState(() => songs.slice(0, 3).map((song) => song.id));
  const [artistBio, setArtistBio] = useState(
    `${profile.artistName} is building a release catalog with Pocket Manager, tracking revenue readiness, platform registration, and the next money moves across every song.`,
  );
  const [contact, setContact] = useState("booking@pocketmanager.app");
  const selectedSongs = useMemo(
    () => songs.filter((song) => selectedSongIds.includes(song.id)),
    [selectedSongIds, songs],
  );
  const displaySongs = selectedSongs.length ? selectedSongs : songs;
  const totalStreams = displaySongs.reduce((t, s) => t + (s.streams ?? 0), 0);
  const monthlyListeners = Math.round(totalStreams * 0.28);
  const playlistCount = displaySongs.filter((s) => s.revenueStreams?.some((r) => r.status === "collecting")).length * 3 + 2;
  const [shareCopied, setShareCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const epkPreviewRef = useRef<HTMLDivElement>(null);

  const handleShareEpk = useCallback(() => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/epk` : "https://pocketmanager.online/epk";
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      window.prompt("Copy this EPK link:", url);
    });
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!epkPreviewRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { PDFDocument }] = await Promise.all([
        import("html2canvas"),
        import("pdf-lib"),
      ]);
      const canvas = await html2canvas(epkPreviewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      // Get JPEG bytes from canvas
      const jpegBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { reject(new Error("canvas to blob failed")); return; }
          resolve(await blob.arrayBuffer());
        }, "image/jpeg", 0.92);
      });
      // Build PDF
      const pdfDoc = await PDFDocument.create();
      const jpgImage = await pdfDoc.embedJpg(jpegBytes);
      const A4_W = 595; // points
      const pageH = Math.round((jpgImage.height * A4_W) / jpgImage.width);
      const page = pdfDoc.addPage([A4_W, pageH]);
      page.drawImage(jpgImage, { x: 0, y: 0, width: A4_W, height: pageH });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile.artistName ?? "epk").toLowerCase().replace(/\s+/g, "-")}-epk.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfLoading(false);
    }
  }, [pdfLoading, profile.artistName]);

  function toggleSong(songId: string) {
    setSelectedSongIds((current) =>
      current.includes(songId) ? current.filter((id) => id !== songId) : [...current, songId],
    );
  }

  return (
    <AppShell title="EPK" eyebrow="Living page">
      <main className="mx-auto max-w-5xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f5f4f0] text-[#111]">
        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Electronic press kit</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">Package the catalog for the room you want in.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            One living page for curators, labels, booking, sync, and partners. It pulls the catalog, readiness, and income proof into one professional surface.
          </p>
        </section>

        {songs.length === 0 && (
          <section className="m-5 rounded-xl border-[0.5px] border-dashed border-black/20 bg-[#f8f6f1] p-6 text-center text-sm text-[#6b6b65]">
            <div className="text-2xl">🎵</div>
            <div className="mt-2 font-medium text-[#111]">No releases yet</div>
            <p className="mt-1">Add a release to build your EPK.</p>
            <Link href="/projects/new" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
              Add release →
            </Link>
          </section>
        )}

        <section className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Builder</div>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Artist bio</span>
                <textarea
                  value={artistBio}
                  onChange={(event) => setArtistBio(event.target.value)}
                  className="min-h-36 w-full rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3 text-sm leading-6 outline-none"
                />
              </label>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Contact</span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm outline-none"
                />
              </label>
            </div>

            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Songs included</div>
              <div className="mt-3 space-y-2">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => toggleSong(song.id)}
                    className={`flex w-full items-center justify-between rounded-lg border-[0.5px] px-3 py-3 text-left text-sm ${
                      selectedSongIds.includes(song.id) ? "border-black/25 bg-[#0a0a0a] text-white" : "border-black/15 bg-white text-[#111]"
                    }`}
                  >
                    <span>{song.title}</span>
                    <span>{getSongReadinessScore(song)}/100</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div ref={epkPreviewRef} className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
            <div className="bg-[#0a0a0a] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Public page preview</div>
              <h3 className="mt-4 text-[40px] font-light leading-none tracking-[-0.03em] text-white">{profile.artistName}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">{artistBio}</p>
              <div className="mt-4 text-sm text-white/45">{contact}</div>
            </div>

            <div className="grid grid-cols-4 divide-x-[0.5px] divide-black/10 border-b-[0.5px] border-black/10">
              <EpkStat label="Streams" value={totalStreams >= 1000000 ? `${(totalStreams / 1000000).toFixed(1)}M` : totalStreams >= 1000 ? `${Math.round(totalStreams / 1000)}K` : String(totalStreams)} />
              <EpkStat label="Monthly" value={monthlyListeners >= 1000 ? `${Math.round(monthlyListeners / 1000)}K` : String(monthlyListeners)} />
              <EpkStat label="Releases" value={String(displaySongs.length)} />
              <EpkStat label="Playlists" value={String(playlistCount)} />
            </div>

            <div className="space-y-3 p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Catalog</div>
              {(selectedSongs.length ? selectedSongs : songs).map((song) => (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  className="block rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition hover:border-black/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-normal text-[#111]">{song.title}</div>
                      <div className="mt-1 text-xs text-[#6b6b65]">
                        {song.releaseDate} · {song.genre ?? "Genre needed"} · {song.mood ?? "Mood needed"}
                      </div>
                    </div>
                    <span className="rounded-full bg-[#eaf3de] px-3 py-1 text-[11px] font-medium text-[#3b6d11]">
                      {getSongReadinessScore(song)}/100
                    </span>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[#514d47]">
                    Confirmed income: {formatMoney(getSongConfirmedIncome(song))}. Readiness and registration proof are ready before the pitch goes out.
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 border-t-[0.5px] border-black/10 p-5">
              <button
                type="button"
                onClick={handleShareEpk}
                className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white transition active:scale-95"
              >
                {shareCopied ? "Link copied ✓" : "Share EPK link"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111] transition hover:bg-[#f5f4f0] active:scale-95 disabled:opacity-50"
              >
                {pdfLoading ? "Generating PDF…" : "Download PDF"}
              </button>
              <Link href="/pitch-kits" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111]">
                Build pitch
              </Link>
            </div>
            <div className="border-t-[0.5px] border-black/10 px-5 py-3 text-center text-[11px] text-[#9a9a8a]">
              Updated today
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function EpkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 text-center">
      <div className="text-lg font-medium text-[#111]">{value}</div>
      <div className="mt-1 text-[10px] text-[#9a9a8a]">{label}</div>
    </div>
  );
}
