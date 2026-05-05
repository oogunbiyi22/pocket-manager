"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { AppShell } from "@/components/app-shell";
import {
  formatMoney,
  formatGapEstimate,
  getMetadataIntelligence,
  getProjectById,
  getRevenueEstimateMethodology,
  getSongReadinessChecklist,
  getSongReadinessScore,
  getWhatAmIMissing,
  releaseRadarMilestones,
  SongVaultAsset,
} from "@/lib/backstage-data";
import { usePocket } from "@/components/pocket-provider";
import dynamic from "next/dynamic";
const ActionModal = dynamic(() => import("@/components/action-modal").then(m => ({ default: m.ActionModal })), { ssr: false });

// Map collection body names → platform registry IDs for the ActionModal
const COLLECTION_BODY_TO_PLATFORM: Record<string, string> = {
  "ASCAP": "ascap",
  "BMI": "bmi",
  "SESAC": "sesac",
  "SoundExchange": "soundexchange",
  "The MLC": "mlc",
  "TuneCore": "tunecore",
  "DistroKid": "distrokid",
  "CD Baby": "cdbaby",
  "ONErpm": "onerpm",
  "YouTube": "youtube",
  "Songtrust": "songtrust",
  "Spotify for Artists": "spotify",
  "Apple Music for Artists": "apple_music",
};

function LargeReadinessRing({ score }: { score: number }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#97c459" : score >= 40 ? "#ef9f27" : "#e24b4a";
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="28" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="500" fill={color}>
        {score}
      </text>
    </svg>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { addSongAssets, addSongCollaborator, completeRevenueAction, projects, signedIn, songs, updateSongMetadata } = usePocket();
  const [fixModal, setFixModal] = useState<{ streamType: string; collectionBody: string } | null>(null);
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const song = songs.find((item) => item.id === projectId);
  const fallbackProject = getProjectById(projectId, projects);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [todayTimestamp] = useState(() => Date.now());
  const [metadataForm, setMetadataForm] = useState({
    isrc: song?.isrc ?? "",
    upc: song?.upc ?? "",
    releaseDate: song?.releaseDate === "Release date needed" ? "" : song?.releaseDate ?? "",
    genre: song?.genre ?? "",
    mood: song?.mood ?? "",
    bpm: song?.bpm ? String(song.bpm) : "",
    musicalKey: song?.musicalKey ?? "",
    language: song?.language ?? "",
    territory: song?.territory ?? "United States",
  });
  const [splitForm, setSplitForm] = useState({
    name: "",
    role: "writer" as const,
    ownershipPercentage: "0",
  });
  const [splitSheetCopied, setSplitSheetCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [assetActionId, setAssetActionId] = useState<string | null>(null);
  const splitTotal = song?.collaborators.reduce((total, collaborator) => total + collaborator.ownershipPercentage, 0) ?? 0;
  const splitSheetText = !song ? "" : [
    "Pocket Manager split sheet preview",
    `Song: ${song.title}`,
    `ISRC: ${song.isrc || "Needed"}`,
    `Release date: ${song.releaseDate}`,
    `Total split: ${splitTotal}%`,
    "",
    ...song.collaborators.map(
      (c) => `${c.name} - ${c.role.replaceAll("_", " ")} - ${c.ownershipPercentage}% - ${c.signed ? "signed" : "unsigned"}`,
    ),
    "",
    "This is an informal summary — not a legally executed split sheet.",
  ].join("\n");

  const notFound = !song && !fallbackProject;
  useEffect(() => {
    if (notFound) router.replace("/projects");
  }, [notFound, router]);

  if (notFound) return null;

  const title = song?.title ?? fallbackProject?.name ?? "Song";
  const readinessScore = song ? getSongReadinessScore(song) : 0;
  const registrationRows = song?.revenueStreams ?? [];
  const readinessChecklist = song ? getSongReadinessChecklist(song) : [];
  const metadataIntelligence = song ? getMetadataIntelligence(song) : null;
  const blockingCount = readinessChecklist.filter((item) => !item.done).length;
  const runwayRows = song ? getRunwayRows(song.releaseDate) : [];
  const missingItems = fallbackProject ? getWhatAmIMissing(fallbackProject) : [];

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (!song) return;

    const files = Array.from(event.target.files ?? []).filter((file) => file.size > 0);
    if (files.length === 0) return;

    setUploadError(null);
    setUploadNotice(null);
    setUploading(true);

    try {
      if (!signedIn) {
        addSongAssets(song.id, files.map(buildLocalAsset));
        setUploadNotice(`${files.length} file${files.length === 1 ? "" : "s"} added to this room on this device.`);
        return;
      }

      const supabase = getSupabase();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token;

      if (!token) {
        addSongAssets(song.id, files.map(buildLocalAsset));
        setUploadError("Signed-in vault sync was unavailable, so the file was saved only on this device.");
        setUploadNotice(`${files.length} file${files.length === 1 ? "" : "s"} still got logged in the room.`);
        return;
      }

      const formData = new FormData();
      formData.append("songId", song.id);
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/v1/assets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Vault upload failed" }));
        addSongAssets(song.id, files.map(buildLocalAsset));
        setUploadError(`${data.error ?? "Vault upload failed"}. Saved file metadata locally instead.`);
        setUploadNotice(`${files.length} file${files.length === 1 ? "" : "s"} still got logged in the room.`);
        return;
      }

      const data = await res.json() as { assets?: SongVaultAsset[] };
      addSongAssets(song.id, data.assets ?? []);
      const savedCount = data.assets?.length ?? 0;
      setUploadNotice(`${savedCount} file${savedCount === 1 ? "" : "s"} synced to the vault.`);
    } catch {
      addSongAssets(song.id, files.map(buildLocalAsset));
      setUploadError("Upload failed. The file metadata was saved locally so the room still stays organized.");
      setUploadNotice(`${files.length} file${files.length === 1 ? "" : "s"} still got logged in the room.`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function addSplit() {
    if (!song || !splitForm.name.trim()) return;
    addSongCollaborator(song.id, {
      name: splitForm.name,
      role: splitForm.role,
      ownershipPercentage: Number(splitForm.ownershipPercentage),
      signed: false,
    });
    setSplitForm({ name: "", role: "writer", ownershipPercentage: "0" });
  }

  function saveMetadata() {
    if (!song) return;
    updateSongMetadata(song.id, {
      ...metadataForm,
      bpm: metadataForm.bpm ? Number(metadataForm.bpm) : undefined,
    });
  }

  async function copySplitSheet() {
    if (!splitSheetText) return;
    await navigator.clipboard.writeText(splitSheetText);
    setSplitSheetCopied(true);
  }

  async function openVaultAsset(asset: SongVaultAsset, download = false) {
    if (asset.source !== "supabase" || !asset.storagePath) {
      setUploadError("This file record exists in the room, but the actual file is only available on the device it was uploaded from.");
      return;
    }

    setUploadError(null);
    setAssetActionId(asset.id);

    try {
      const supabase = getSupabase();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token;

      if (!token) {
        setUploadError("Sign in again to open synced vault files.");
        return;
      }

      const url = new URL("/api/v1/assets", window.location.origin);
      url.searchParams.set("path", asset.storagePath);
      if (download) url.searchParams.set("download", "1");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Could not open file" }));
        setUploadError(data.error ?? "Could not open file");
        return;
      }

      const data = await res.json() as { url?: string };
      if (!data.url) {
        setUploadError("Could not open file");
        return;
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setUploadError("Could not open file right now.");
    } finally {
      setAssetActionId(null);
    }
  }

  const filedAssets = song?.assets ?? [];
  const syncedAssets = filedAssets.filter((asset) => asset.source === "supabase");
  const requiredAssetKinds: SongVaultAsset["kind"][] = ["master", "artwork", "split", "contract"];
  const missingCriticalKinds = requiredAssetKinds.filter((kind) => !filedAssets.some((asset) => asset.kind === kind));
  const nextMissingKind = missingCriticalKinds[0] ?? null;
  const orderedAssets = [...filedAssets].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return (
    <AppShell title={title} eyebrow="The Room">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">

        {/* Cover art header */}
        <section className="bg-[#1e1e1b] px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="grid size-20 shrink-0 place-items-center rounded-xl border-[0.5px] border-white/10 bg-[#33332f] text-[11px] uppercase tracking-[0.16em] text-white/25">
              Art
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The Room</div>
              <h2 className="mt-2 truncate text-3xl font-light tracking-[-0.03em] text-white">{title}</h2>
              <p className="mt-2 text-sm text-white/35">
                {song
                  ? `${song.isrc} · ${song.releaseDate} · ${song.territory}`
                  : "Add ISRC and platform registrations next."}
              </p>
            </div>
            {song && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/55 transition hover:border-white/30 hover:text-white/80 active:scale-95"
                aria-label="Share"
              >
                Share →
              </button>
            )}
          </div>
        </section>

        {/* Readiness ring — 56px */}
        <section className="flex items-center gap-4 border-y-[0.5px] border-white/10 bg-[#141412] px-5 py-4">
          <LargeReadinessRing score={readinessScore} />
          <div>
            <div className="text-[15px] font-medium text-white">{readinessScore}% ready</div>
            <p className="mt-1 text-sm text-white/35">
              {blockingCount} item{blockingCount === 1 ? "" : "s"} blocking
            </p>
          </div>
        </section>

        {/* Revenue gap table */}
        {song ? (
          <section className="px-5 py-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6a6a5a]">Revenue streams</div>
            <div className="overflow-hidden rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b]">
              {registrationRows.map((stream) => {
                const methodology = getRevenueEstimateMethodology(song, stream);
                const isGap = stream.estimatedGap > 0;

                return (
                  <article key={`${stream.streamType}-${stream.collectionBody}`} className="border-b-[0.5px] border-white/10 p-4 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-normal text-white">{stream.label}</h3>
                        <p className="mt-0.5 text-[11px] text-white/35">{stream.collectionBody}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${statusClass(stream.status)}`}>
                        {stream.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    {/* Amounts row */}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Collected </span>
                        <span className="text-[#97c459]">{formatMoney(stream.actualAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Gap </span>
                        <span className={isGap ? "text-[#e24b4a]" : "text-white/35"}>{formatGapEstimate(stream.estimatedGap)}</span>
                      </div>
                      {isGap ? (
                        <button
                          type="button"
                          onClick={() => setFixModal({ streamType: stream.streamType, collectionBody: stream.collectionBody })}
                          className="ml-auto rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[#0d0d0b] active:scale-95 transition"
                        >
                          Fix →
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-2 text-[12px] leading-5 text-white/45">{stream.reason}</p>

                    <details className="mt-3 rounded-lg border-[0.5px] border-white/10 bg-[#141412] px-3 py-2 text-sm text-white/55">
                      <summary className="cursor-pointer list-none marker:hidden">How is this calculated?</summary>
                      <div className="mt-3 rounded-lg bg-[#1e1e1b] p-3 leading-6">
                        <div>{stream.rateNote}</div>
                        <div className="mt-3 text-white">{methodology.formula}</div>
                        <ul className="mt-3 space-y-1">
                          {methodology.basis.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <div className="mt-3 text-xs leading-5 text-white/35">{methodology.caveat}</div>
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="m-5 rounded-xl border-[0.5px] border-[#ef9f27]/50 bg-[#ef9f27]/20 p-4 text-[#854f0b]">
            Add an ISRC or connect one platform so Pocket can calculate the first estimated revenue gap.
          </section>
        )}

        {/* Readiness checklist + splits */}
        <section className="grid gap-5 bg-white px-5 py-5 text-[#111] lg:grid-cols-[1fr_0.9fr]">
          {/* Checklist */}
          <div>
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Registration checklist</div>
            <div className="space-y-2">
              {readinessChecklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[15px] leading-none ${item.done ? "text-[#3b6d11]" : "text-[#a32d2d]"}`}>
                      {item.done ? "✓" : "!"}
                    </span>
                    <div>
                      <div className="text-[#111]">{item.label}</div>
                      <div className="mt-0.5 text-[10px] text-[#6d6860]">{item.points} pts</div>
                    </div>
                  </div>
                  {!item.done ? (
                    <Link href={item.href} className="shrink-0 rounded-full bg-[#fcebeb] px-3 py-1 text-[11px] font-medium text-[#a32d2d]">
                      {item.action}
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#eaf3de] px-3 py-1 text-[11px] font-medium text-[#3b6d11]">Done</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Splits */}
          <div>
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Splits</div>

            {/* Existing collaborators */}
            {song && song.collaborators.length > 0 ? (
              <div className="mb-3 overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1]">
                {song.collaborators.map((c, i) => (
                  <div
                    key={`${c.name}-${i}`}
                    className="flex items-center justify-between gap-3 border-b-[0.5px] border-black/10 px-4 py-3 text-sm last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-[#111]">{c.name}</div>
                      <div className="mt-0.5 text-[11px] text-[#6d6860]">{c.role.replaceAll("_", " ")} · {c.ownershipPercentage}%</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${c.signed ? "bg-[#eaf3de] text-[#3b6d11]" : "bg-[#faeeda] text-[#854f0b]"}`}>
                      {c.signed ? "Signed" : "Unsigned"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Add split form */}
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">Add split</div>
              <div className="mt-3 grid gap-2">
                <input
                  value={splitForm.name}
                  onChange={(e) => setSplitForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Collaborator name"
                  className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2 text-sm outline-none"
                />
                <div className="grid grid-cols-[1fr_0.8fr] gap-2">
                  <select
                    value={splitForm.role}
                    onChange={(e) => setSplitForm((c) => ({ ...c, role: e.target.value as typeof splitForm.role }))}
                    className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2 text-sm outline-none"
                  >
                    {["writer", "producer", "featured_artist", "master_owner"].map((role) => (
                      <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <input
                    value={splitForm.ownershipPercentage}
                    onChange={(e) => setSplitForm((c) => ({ ...c, ownershipPercentage: e.target.value }))}
                    inputMode="decimal"
                    placeholder="%"
                    className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2 text-sm outline-none"
                  />
                </div>
                <button type="button" onClick={addSplit} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                  Add collaborator
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-[#6d6860]">{splitTotal}% assigned</span>
                <button type="button" onClick={copySplitSheet} className="text-xs text-[#854f0b]">
                  {splitSheetCopied ? "Copied" : "Copy split sheet"}
                </button>
              </div>
            </div>

            {/* Song details */}
            <div className="mt-3 space-y-2">
              <Detail label="Distribution" value={song?.distributionPlatforms.join(" · ") ?? "—"} />
              <Detail label="Metadata" value={song?.metadataComplete ? "Complete" : "Incomplete"} />
              <Detail label="Split sheet" value={song?.splitSheetSigned ? "Signed" : "Needs signatures"} />
            </div>
          </div>
        </section>

        {/* Metadata intelligence */}
        {metadataIntelligence ? (
          <section className="bg-white px-5 pb-5 text-[#111]">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Metadata</div>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="mb-3 text-[13px] font-medium text-[#111]">{metadataIntelligence.score}% complete</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["ISRC", "isrc"],
                  ["UPC", "upc"],
                  ["Release date", "releaseDate"],
                  ["Genre", "genre"],
                  ["Mood", "mood"],
                  ["BPM", "bpm"],
                  ["Key", "musicalKey"],
                  ["Language", "language"],
                  ["Territory", "territory"],
                ].map(([label, key]) => (
                  <label key={key} className="block text-sm text-[#514d47]">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-[#9a9a8a]">{label}</span>
                    <input
                      type={key === "releaseDate" ? "date" : "text"}
                      value={metadataForm[key as keyof typeof metadataForm]}
                      onChange={(e) => setMetadataForm((c) => ({ ...c, [key]: e.target.value }))}
                      className="h-10 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                    />
                  </label>
                ))}
              </div>
              <button type="button" onClick={saveMetadata} className="mt-4 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Save metadata
              </button>
            </div>
          </section>
        ) : null}

        {/* Live stats from Songstats */}
        {song?.isrc && <SongstatsPanel isrc={song.isrc} spotifyArtistId={song.spotifyArtistId} />}

        {/* Streaming links across all DSPs via MusicFetch */}
        {song?.isrc && <MusicFetchPanel isrc={song.isrc} />}

        {/* Emotional Story — pitch DNA */}
        {song && (
          <section className="bg-white px-5 pb-5 text-[#111]">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Emotional story</div>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <p className="mb-3 text-[11px] leading-5 text-[#9a9a8a]">
                How did you feel when you made this song? Write it raw — this powers every pitch in your exact voice. You only write it once.
              </p>
              <EmotionalStoryField song={song} updateSongMetadata={updateSongMetadata} />
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/pitching?song=${song.id}`}
                  className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white"
                >
                  Launch Pitching Engine →
                </Link>
                <Link href="/pitch-kits" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#514d47]">
                  Pitch kit
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Files */}
        <section className="bg-white px-5 pb-5 text-[#111]">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Files</div>
          <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
            <div className="mb-4 overflow-hidden rounded-[18px] border-[0.5px] border-black/10 bg-[#11110f] text-white">
              <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Vault command</div>
                  <div className="mt-2 text-lg font-medium text-white">Keep the release package complete and cross-device.</div>
                  <p className="mt-1 max-w-[540px] text-sm leading-6 text-white/45">
                    Every room should carry the real release package: master, artwork, splits, and contracts — not just notes about them.
                  </p>
                </div>
                <div className="grid min-w-[240px] flex-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Filed</div>
                    <div className="mt-1 text-lg text-white">{filedAssets.length}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Synced</div>
                    <div className="mt-1 text-lg text-white">{syncedAssets.length}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Still missing</div>
                    <div className="mt-1 text-lg text-white">{missingCriticalKinds.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {missingCriticalKinds.length > 0 ? (
              <div className="mb-4 rounded-lg border border-[#ef9f27]/30 bg-[#faeeda] px-3 py-3 text-xs text-[#854f0b]">
                <div className="font-medium uppercase tracking-[0.14em]">Need in this room</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingCriticalKinds.map((kind) => (
                    <span key={kind} className="rounded-full border border-[#ef9f27]/25 bg-white px-2.5 py-1 uppercase tracking-[0.12em]">
                      {kind === "split" ? "Split sheet" : kind}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-[#97c459]/30 bg-[#eaf3de] px-3 py-3 text-xs text-[#3b6d11]">
                Core release files are covered in this room.
              </div>
            )}

            <div className="mb-4 grid gap-3 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-xl border-[0.5px] border-black/10 bg-white px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[#9a9a8a]">Manager says</div>
                <div className="mt-2 text-sm leading-6 text-[#111]">
                  {nextMissingKind
                    ? `Get the ${getAssetKindLabel(nextMissingKind).toLowerCase()} into this room next so the package is harder to break during release week.`
                    : "This room has the core release file set. From here, focus on cleaner versions, alternate artwork, and anything you might need on another device fast."}
                </div>
              </div>
              <div className="rounded-xl border-[0.5px] border-black/10 bg-white px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[#9a9a8a]">Cross-device health</div>
                <div className="mt-2 text-sm leading-6 text-[#111]">
                  {syncedAssets.length === 0
                    ? "Nothing here is safely available across devices yet. Syncing matters if you suddenly switch phones, laptops, or WiFi spots."
                    : syncedAssets.length === filedAssets.length
                      ? "Everything filed here is available cross-device. Good — this room is starting to behave like a real vault."
                      : `${syncedAssets.length} of ${filedAssets.length} filed item${filedAssets.length === 1 ? " is" : "s are"} safely synced across devices.`}
                </div>
              </div>
            </div>

            <label className="block rounded-lg border-[0.5px] border-dashed border-black/25 bg-white px-4 py-4 text-sm text-[#514d47]">
              <span className="block">Add essential files — master, stems, artwork, contracts</span>
              <span className="mt-1 block text-[11px] text-[#9a9a8a]">
                {signedIn ? "Uploads sync to your vault when storage is configured." : "Sign in to sync uploads across devices. For now this room will save file records on this device."}
              </span>
              <input type="file" multiple accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.wav,.mp3,.aiff,.zip" onChange={handleFileChange} className="mt-3 block w-full text-sm" />
            </label>
            {uploading && <div className="mt-3 text-sm text-[#514d47]">Uploading to the vault…</div>}
            {uploadNotice && <div className="mt-3 rounded-lg border border-[#97c459]/30 bg-[#eaf3de] px-3 py-2 text-xs text-[#3b6d11]">{uploadNotice}</div>}
            {uploadError && <div className="mt-3 rounded-lg border border-[#ef9f27]/30 bg-[#faeeda] px-3 py-2 text-xs text-[#854f0b]">{uploadError}</div>}
            {filedAssets.length === 0 ? (
              <div className="mt-3 rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-3 text-sm text-[#9a9a8a]">
                No files in this room yet.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {orderedAssets.map((asset) => (
                  <div key={asset.id} className={`rounded-xl border-[0.5px] px-4 py-4 text-sm text-[#111] ${getAssetTone(asset.kind)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#6d6860]">{getAssetGlyph(asset.kind)}</span>
                          <span className="rounded-full border border-black/10 bg-white/70 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#6d6860]">
                            {getAssetKindLabel(asset.kind)}
                          </span>
                        </div>
                        <div className="mt-3 truncate text-[15px] font-medium text-[#111]">{asset.name}</div>
                        <div className="mt-1 text-[11px] text-[#6d6860]">
                          {asset.sizeLabel} · {asset.source === "supabase" ? "Synced across devices" : "Saved on this device only"}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${asset.source === "supabase" ? "bg-[#eaf3de] text-[#3b6d11]" : "bg-[#faeeda] text-[#854f0b]"}`}>
                        {asset.source === "supabase" ? "Synced" : "Local only"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {asset.source === "supabase" && asset.storagePath ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void openVaultAsset(asset)}
                            disabled={assetActionId === asset.id}
                            className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#514d47] transition hover:border-black/25 disabled:opacity-50"
                          >
                            {assetActionId === asset.id ? "Opening…" : "Open"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void openVaultAsset(asset, true)}
                            disabled={assetActionId === asset.id}
                            className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#514d47] transition hover:border-black/25 disabled:opacity-50"
                          >
                            Download
                          </button>
                        </>
                      ) : (
                        <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#6d6860]">
                          Upload from a signed-in session to sync
                        </span>
                      )}
                      <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#6d6860]">
                        Filed in room
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* The Runway */}
        {song && runwayRows.length ? (
          <section className="bg-[#141412] px-5 pb-5 text-white">
            <div className="flex items-center justify-between py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The Runway</div>
              {song.releaseDate && song.releaseDate !== "Release date needed" ? (
                <div className="text-[11px] text-white/35">
                  {(() => {
                    const days = Math.ceil((new Date(`${song.releaseDate}T12:00:00`).getTime() - todayTimestamp) / 86400000);
                    return days > 0 ? `${days}d to release` : days === 0 ? "Release day" : `${Math.abs(days)}d post-release`;
                  })()}
                </div>
              ) : null}
            </div>

            {/* Visual progress bar */}
            <div className="relative mx-1 mb-5 h-[4px] rounded-full bg-[#1e1e1b]">
              {(() => {
                const total = runwayRows.length;
                const lastDoneIdx = runwayRows.reduce((acc, row, i) => (row.status === "Done" ? i : acc), -1);
                const fillPct = total > 1 && lastDoneIdx >= 0 ? (lastDoneIdx / (total - 1)) * 100 : 0;
                return (
                  <>
                    <div className="h-full rounded-full bg-[#3b6d11] transition-all duration-700" style={{ width: `${fillPct}%` }} />
                    {runwayRows.map((row, i) => {
                      const left = total > 1 ? (i / (total - 1)) * 100 : 0;
                      const isDone = row.status === "Done";
                      const isDue = row.status === "Due now";
                      return (
                        <div
                          key={row.title}
                          className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                            isDone ? "bg-[#3b6d11]" : isDue ? "border-[1.5px] border-white/70 bg-transparent" : "border-[1.5px] border-white/25 bg-transparent"
                          }`}
                          style={{ left: `${left}%` }}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Checkpoints */}
            <div className="space-y-0">
              {runwayRows.map((row) => {
                const isDone = row.status === "Done";
                const isDue = row.status === "Due now";
                return (
                  <div key={`${row.title}-${row.daysBefore}`} className="flex items-start gap-3 border-b-[0.5px] border-white/[0.05] py-3 last:border-b-0">
                    <div className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[9px] ${
                      isDone ? "bg-[#eaf3de] text-[#3b6d11]" : isDue ? "bg-[#2a1800] text-[#ef9f27]" : "bg-white/5 text-white/30"
                    }`}>
                      {isDone ? "✓" : "○"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[13px] ${isDue ? "font-medium text-white" : isDone ? "text-white/40" : "text-white/70"}`}>{row.title}</div>
                      <div className="mt-0.5 text-[11px] leading-5 text-white/30">{row.detail}</div>
                    </div>
                    {isDue && (
                      <span className="shrink-0 rounded-lg bg-[#ef9f27] px-2 py-1 text-[10px] font-medium text-black">Now</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* What am I missing? */}
        {missingItems.length > 0 && (
          <section className="bg-white px-5 pb-5 text-[#111]">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">What am I missing?</div>
            <div className="overflow-hidden rounded-xl border-[0.5px] border-[#e24b4a]/30 bg-[#fcebeb]">
              {missingItems.map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${i < missingItems.length - 1 ? "border-b-[0.5px] border-[#e24b4a]/15" : ""}`}
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-[#e24b4a]" />
                  <span className="text-[#a32d2d]">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#9a9a8a]">
              Fix these before pitching or releasing.
            </p>
          </section>
        )}

        {/* Bottom CTAs */}
        {song ? (
          <div className="flex flex-wrap gap-3 bg-white px-5 pb-5 text-[#111]">
            <Link href="/signal" className="flex rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
              Create promo →
            </Link>
            <Link href="/epk" className="flex rounded-lg border-[0.5px] border-black/15 px-5 py-3 text-sm font-medium text-[#111]">
              Build EPK
            </Link>
          </div>
        ) : null}
      </main>

      {/* Share sheet */}
        {shareOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              style={{ animation: "fadeIn 0.18s ease both" }}
              onClick={() => setShareOpen(false)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-[24px] bg-[rgba(20,20,18,0.92)] text-white backdrop-blur-xl"
              style={{ animation: "slideUp 0.28s cubic-bezier(0.16,1,0.3,1) both" }}
            >
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
              {/* Handle */}
              <div className="flex justify-center pt-[10px] pb-1">
                <div className="h-1 w-9 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <div className="text-[15px] font-medium">Share</div>
                  <div className="text-xs text-white/35">{title}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="text-2xl font-light text-white/30"
                  aria-label="Close share sheet"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-3 p-5">
                {/* Option 1: Share EPK link */}
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${window.location.origin}/epk/${projectId}`);
                    setShareOpen(false);
                  }}
                  className="flex items-center gap-4 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-4 text-left transition active:scale-[0.98]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-lg">⊞</span>
                  <div>
                    <div className="text-[15px] font-normal text-white">Share EPK link</div>
                    <div className="mt-0.5 text-xs text-white/40">Copy shareable link for this song</div>
                  </div>
                  <span className="ml-auto text-xs text-white/25">Copy →</span>
                </button>

                {/* Option 2: Generate promo asset */}
                <Link
                  href="/signal"
                  onClick={() => setShareOpen(false)}
                  className="flex items-center gap-4 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-4 transition active:scale-[0.98]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-lg">◈</span>
                  <div>
                    <div className="text-[15px] font-normal text-white">Generate promo asset</div>
                    <div className="mt-0.5 text-xs text-white/40">Create art, caption, or pitch card in Signal</div>
                  </div>
                  <span className="ml-auto text-xs text-white/25">→</span>
                </Link>

                {/* Option 3: Invite collaborator */}
                <Link
                  href="/guild"
                  onClick={() => setShareOpen(false)}
                  className="flex items-center gap-4 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-4 transition active:scale-[0.98]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-lg">○</span>
                  <div>
                    <div className="text-[15px] font-normal text-white">Invite collaborator</div>
                    <div className="mt-0.5 text-xs text-white/40">Add someone to this song via Guild</div>
                  </div>
                  <span className="ml-auto text-xs text-white/25">→</span>
                </Link>
              </div>

              {/* Safe area spacing */}
              <div className="h-6" />
            </div>
          </>
        )}

      {/* Action modal — opens when artist taps "Fix →" on a revenue gap */}
      {fixModal && song && (
        <ActionModal
          platformId={COLLECTION_BODY_TO_PLATFORM[fixModal.collectionBody]}
          platform={
            COLLECTION_BODY_TO_PLATFORM[fixModal.collectionBody]
              ? undefined
              : {
                  name: fixModal.collectionBody,
                  group: "PRO",
                  whyItMatters: `Register this song with ${fixModal.collectionBody} to close this revenue gap.`,
                  steps: [`Go to ${fixModal.collectionBody}`, "Register this song and your writer information", "Return here when done"],
                  confirmPrompt: `I've registered this song with ${fixModal.collectionBody}`,
                  estimatedMinutes: 10,
                }
          }
          open={fixModal !== null}
          onClose={() => setFixModal(null)}
          onComplete={() => {
            completeRevenueAction(song.id, fixModal.streamType, fixModal.collectionBody);
            setFixModal(null);
          }}
        />
      )}
    </AppShell>
  );
}

function EmotionalStoryField({
  song,
  updateSongMetadata,
}: {
  song: { id: string; emotionalStory?: string };
  updateSongMetadata: (id: string, data: { emotionalStory: string }) => void;
}) {
  const [value, setValue] = useState(song.emotionalStory ?? "");
  const [saved, setSaved] = useState(false);

  function save() {
    updateSongMetadata(song.id, { emotionalStory: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
        placeholder="Write from the gut — what were you feeling, going through, trying to survive when you made this? This becomes the soul of every pitch."
        className="w-full resize-none rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2 text-sm text-[#111] outline-none placeholder:text-[#aaa]"
      />
      <button
        type="button"
        onClick={save}
        className="mt-2 rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-1.5 text-xs text-[#514d47]"
      >
        {saved ? "Saved ✓" : "Save story"}
      </button>
    </div>
  );
}

type MusicFetchLinks = Record<string, { url?: string; label?: string }>;

function MusicFetchPanel({ isrc }: { isrc: string }) {
  const [links, setLinks] = useState<MusicFetchLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/musicfetch?isrc=${encodeURIComponent(isrc)}`);
        if (!cancelled) {
          if (res.status === 503) { setUnavailable(true); setLoading(false); return; }
          if (!res.ok) { setLoading(false); return; }
          const data = await res.json() as { services?: MusicFetchLinks };
          setLinks(data.services ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [isrc]);

  if (unavailable) return null; // silently skip if not configured

  const DSP_LABELS: Record<string, string> = {
    spotify: "Spotify", appleMusic: "Apple Music", youtube: "YouTube",
    youtubeMusic: "YouTube Music", deezer: "Deezer", tidal: "TIDAL",
    amazonMusic: "Amazon Music", soundcloud: "SoundCloud", pandora: "Pandora",
    kkbox: "KKBOX", napster: "Napster", qobuz: "Qobuz",
  };

  const activeLinks = links
    ? Object.entries(links)
        .filter(([k, v]) => DSP_LABELS[k] && v?.url)
        .map(([k, v]) => ({ key: k, label: DSP_LABELS[k], url: v.url! }))
    : [];

  return (
    <section className="bg-white px-5 pb-5 text-[#111]">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Streaming links</div>
      <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
        {loading && <div className="text-sm text-[#9a9a8a]">Finding links…</div>}
        {!loading && activeLinks.length === 0 && (
          <div className="text-sm text-[#9a9a8a]">No links found yet — ISRC resolves once the release goes live.</div>
        )}
        {!loading && activeLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeLinks.map(({ key, label, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-1.5 text-xs text-[#514d47] hover:border-black/35"
              >
                {label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SongstatsPanel({ isrc, spotifyArtistId }: { isrc: string; spotifyArtistId?: string }) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [radioStats, setRadioStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabase();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data?.session?.access_token;
        if (!token) { setLoading(false); return; }

        const headers = { Authorization: `Bearer ${token}` };
        const [trackRes, radioRes] = await Promise.allSettled([
          fetch(`/api/songstats?endpoint=tracks/stats&isrc=${encodeURIComponent(isrc)}`, { headers }),
          fetch(`/api/radiostats?endpoint=tracks/stats&isrc=${encodeURIComponent(isrc)}`, { headers }),
        ]);

        if (!cancelled) {
          if (trackRes.status === "fulfilled" && trackRes.value.ok) {
            const data = await trackRes.value.json();
            setStats(data as Record<string, unknown>);
          }
          if (radioRes.status === "fulfilled" && radioRes.value.ok) {
            const data = await radioRes.value.json();
            setRadioStats(data as Record<string, unknown>);
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setLoading(false); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [isrc, spotifyArtistId]);

  const fmt = (n: unknown) => typeof n === "number" ? n.toLocaleString() : "—";

  const sources = Array.isArray((stats as { stats?: unknown })?.stats)
    ? (stats as { stats: { source: string; total_streams?: number; total_playlists?: number }[] }).stats
    : [];

  const totalStreams = sources.reduce((acc, s) => acc + (s.total_streams ?? 0), 0);
  const totalPlaylists = sources.reduce((acc, s) => acc + (s.total_playlists ?? 0), 0);
  const radioPlays = (radioStats as { total_plays?: number } | null)?.total_plays;

  return (
    <section className="bg-white px-5 pb-5 text-[#111]">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Live stats</div>
      <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
        {loading && <div className="text-sm text-[#9a9a8a]">Loading live data…</div>}
        {error && <div className="text-sm text-[#e24b4a]">Could not load stats: {error}</div>}
        {!loading && !error && sources.length === 0 && !radioPlays && (
          <div className="text-sm text-[#9a9a8a]">No data yet — stats appear once the song is live on DSPs and SONGSTATS_API_KEY is set.</div>
        )}
        {!loading && (sources.length > 0 || radioPlays !== undefined) && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white px-3 py-3 text-center">
              <div className="text-[18px] font-medium text-[#111]">{fmt(totalStreams)}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-[#9a9a8a]">Total streams</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-3 text-center">
              <div className="text-[18px] font-medium text-[#111]">{fmt(totalPlaylists)}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-[#9a9a8a]">Playlists</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-3 text-center">
              <div className="text-[18px] font-medium text-[#111]">{fmt(radioPlays)}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-[#9a9a8a]">Radio spins</div>
            </div>
          </div>
        )}
        {!loading && sources.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {sources.map((s) => (
              <div key={s.source} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                <span className="capitalize text-[#514d47]">{s.source}</span>
                <span className="font-medium text-[#111]">{fmt(s.total_streams)} streams</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-sm">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">{label}</div>
      <div className="mt-1.5 leading-6 text-[#111]">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "collecting" || status === "connected") return "bg-[#97c459]/25 text-[#3b6d11]";
  if (status === "registered_not_collecting" || status === "incomplete") return "bg-[#ef9f27]/20 text-[#854f0b]";
  return "bg-[#e24b4a]/15 text-[#a32d2d]";
}

function buildLocalAsset(file: File): SongVaultAsset {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    kind: inferAssetKind(file.name, file.type),
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    sizeLabel: formatFileSize(file.size),
    uploadedAt: new Date().toISOString(),
    source: "local",
  };
}

function getAssetKindLabel(kind: SongVaultAsset["kind"]) {
  if (kind === "split") return "Split sheet";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function getAssetGlyph(kind: SongVaultAsset["kind"]) {
  switch (kind) {
    case "master":
      return "◉";
    case "artwork":
      return "▣";
    case "split":
      return "≡";
    case "contract":
      return "✦";
    default:
      return "•";
  }
}

function getAssetTone(kind: SongVaultAsset["kind"]) {
  switch (kind) {
    case "master":
      return "border-[#97c459]/30 bg-[#f4f8ec]";
    case "artwork":
      return "border-[#c7a6ff]/35 bg-[#f7f2ff]";
    case "split":
      return "border-[#ef9f27]/30 bg-[#fff6e8]";
    case "contract":
      return "border-[#7dc4ff]/30 bg-[#eef7ff]";
    default:
      return "border-black/10 bg-white";
  }
}

function inferAssetKind(fileName: string, mimeType: string): SongVaultAsset["kind"] {
  if (/image\//i.test(mimeType) || /cover|art|photo|image/i.test(fileName)) return "artwork";
  if (/audio\//i.test(mimeType) || /master|wav|mp3|stem|mix/i.test(fileName)) return "master";
  if (/split/i.test(fileName)) return "split";
  if (/contract|agreement|license/i.test(fileName)) return "contract";
  return "other";
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${bytes} B`;
}

function getRunwayRows(releaseDate: string) {
  const target = new Date(`${releaseDate}T12:00:00`);

  if (Number.isNaN(target.getTime())) {
    return [];
  }

  const today = new Date();
  const daysUntilRelease = Math.ceil((target.getTime() - today.getTime()) / 86400000);

  return releaseRadarMilestones.map((milestone) => {
    const checkpointDistance = daysUntilRelease - milestone.daysBefore;
    let status: "Done" | "Due now" | "Upcoming" | "Missed" = "Upcoming";

    if (checkpointDistance > 2) {
      status = "Done";
    } else if (checkpointDistance >= -1) {
      status = "Due now";
    } else {
      status = "Upcoming";
    }

    return {
      ...milestone,
      status,
    };
  });
}
