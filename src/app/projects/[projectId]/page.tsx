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
  const [metadataNotice, setMetadataNotice] = useState<string | null>(null);
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
  const topGapStream = [...registrationRows].sort((a, b) => b.estimatedGap - a.estimatedGap)[0];
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
        setUploadError("Signed-in vault sync is unavailable right now. Please sign in again before uploading files.");
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
        setUploadError(data.error ?? "Vault upload failed");
        return;
      }

      const data = await res.json() as { assets?: SongVaultAsset[] };
      addSongAssets(song.id, data.assets ?? []);
      const savedCount = data.assets?.length ?? 0;
      setUploadNotice(`${savedCount} file${savedCount === 1 ? "" : "s"} synced to the vault.`);
    } catch {
      setUploadError("Upload failed. Nothing was saved to the vault.");
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
    setMetadataNotice("Metadata saved to this room.");
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
  const roomStateLabel = blockingCount === 0 ? "Room in strong shape" : blockingCount === 1 ? "1 blocker left" : `${blockingCount} blockers left`;
  const roomStateDetail = topGapStream?.estimatedGap
    ? `Biggest money move: ${topGapStream.collectionBody}.`
    : missingCriticalKinds.length > 0
      ? `Next file to lock in: ${getAssetKindLabel(nextMissingKind ?? "master")}.`
      : "Core release path is looking solid.";
  const roomCommandPrompt = topGapStream?.estimatedGap
    ? `What should I do next for \"${title}\"? Walk me through fixing ${topGapStream.collectionBody} first.`
    : nextMissingKind
      ? `What am I missing for \"${title}\"? Help me finish the ${getAssetKindLabel(nextMissingKind).toLowerCase()} and release package.`
      : `Give me the next best move for \"${title}\" now that the core room is in better shape.`;

  return (
    <AppShell title={title} eyebrow="The Room">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-white/10 bg-[#141412] text-white">

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
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/55">
                <span className={`size-1.5 rounded-full ${blockingCount === 0 ? "bg-[#5fcf7e]" : blockingCount <= 2 ? "bg-[#ef9f27]" : "bg-[#e24b4a]"}`} />
                <span>{roomStateLabel}</span>
                <span className="text-white/25">•</span>
                <span>{roomStateDetail}</span>
              </div>
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
        <section className="flex items-center justify-between gap-4 border-y-[0.5px] border-white/10 bg-[#141412] px-5 py-4">
          <div className="flex items-center gap-4">
            <LargeReadinessRing score={readinessScore} />
            <div>
              <div className="text-[15px] font-medium text-white">{readinessScore}% ready</div>
              <p className="mt-1 text-sm text-white/35">
                {blockingCount === 0 ? "No core blockers right now." : `${blockingCount} item${blockingCount === 1 ? "" : "s"} still blocking this release.`}
              </p>
            </div>
          </div>
          <div className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right md:block">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Next best move</div>
            <div className="mt-1 text-xs text-white/75">{topGapStream?.estimatedGap ? `Fix ${topGapStream.collectionBody}` : nextMissingKind ? `Upload ${getAssetKindLabel(nextMissingKind)}` : "Review the room"}</div>
          </div>
        </section>

        {song ? (
          <section className="border-b-[0.5px] border-white/10 bg-[#11110f] px-5 py-5 text-white">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Finish this room</div>
                <div className="mt-2 text-lg font-medium text-white">Keep the next move obvious.</div>
                <p className="mt-1 max-w-[560px] text-sm leading-6 text-white/45">
                  Pocket should tell you what to close next — not make you hunt through the room.
                </p>
              </div>
              <Link
                href={`/a?prompt=${encodeURIComponent(roomCommandPrompt)}`}
                className="rounded-full border border-[#7c6fef]/35 bg-[#7c6fef]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#c7bfff] transition hover:bg-[#7c6fef]/20"
              >
                Ask A →
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <ActionJumpCard
                label="Close the biggest gap"
                value={topGapStream?.estimatedGap ? formatGapEstimate(topGapStream.estimatedGap) : "No open gap"}
                detail={topGapStream?.estimatedGap ? `${topGapStream.collectionBody} · ${topGapStream.action}` : "Revenue registrations look covered for now."}
                href="#revenue-streams"
                cta={topGapStream?.estimatedGap ? "Fix revenue →" : "Review revenue →"}
                tone={topGapStream?.estimatedGap ? "warning" : "success"}
              />
              <ActionJumpCard
                label="Complete metadata"
                value={song.metadataComplete ? "Ready" : `${metadataIntelligence?.score ?? 0}%`}
                detail={song.metadataComplete ? "ISRC, release details, and metadata are covered." : "Finish the fields that block release readiness and smarter pitching."}
                href="#metadata-panel"
                cta={song.metadataComplete ? "Review metadata →" : "Finish metadata →"}
                tone={song.metadataComplete ? "success" : "neutral"}
              />
              <ActionJumpCard
                label="File the release package"
                value={missingCriticalKinds.length === 0 ? "Covered" : `${missingCriticalKinds.length} missing`}
                detail={missingCriticalKinds.length === 0 ? "Master, artwork, split sheet, and contract are in the room." : `Next up: ${getAssetKindLabel(nextMissingKind ?? "master")}.`}
                href="#files-panel"
                cta={missingCriticalKinds.length === 0 ? "Open files →" : "Upload next file →"}
                tone={missingCriticalKinds.length === 0 ? "success" : "warning"}
              />
            </div>
          </section>
        ) : null}

        {/* Revenue gap table */}
        {song ? (
          <section id="revenue-streams" className="px-5 py-5">
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
                          className="ml-auto rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 active:scale-95 transition"
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
          <section className="m-5 rounded-xl border-[0.5px] border-[#ef9f27]/50 bg-[#ef9f27]/20 p-4 text-[#f0a832]">
            Add an ISRC or connect one platform so Pocket can calculate the first estimated revenue gap.
          </section>
        )}

        {/* Readiness checklist + splits */}
        <section id="registration-checklist" className="grid gap-5 glass-subtle px-5 py-5 text-white/90 lg:grid-cols-[1fr_0.9fr]">
          {/* Checklist */}
          <div>
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Registration checklist</div>
            <div className="space-y-2">
              {readinessChecklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[15px] leading-none ${item.done ? "text-[#5fcf7e]" : "text-[#f05c5c]"}`}>
                      {item.done ? "✓" : "!"}
                    </span>
                    <div>
                      <div className="text-white/90">{item.label}</div>
                      <div className="mt-0.5 text-[10px] text-[#6d6860]">{item.points} pts</div>
                    </div>
                  </div>
                  {!item.done ? (
                    <Link href={item.href} className="shrink-0 rounded-full bg-[#f05c5c]/10 px-3 py-1 text-[11px] font-medium text-[#f05c5c]">
                      {item.action}
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#5fcf7e]/10 px-3 py-1 text-[11px] font-medium text-[#5fcf7e]">Done</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Splits */}
          <div>
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Splits</div>

            {/* Existing collaborators */}
            {song && song.collaborators.length > 0 ? (
              <div className="mb-3 overflow-hidden rounded-xl border-[0.5px] border-white/10 bg-white/[0.05]">
                {song.collaborators.map((c, i) => (
                  <div
                    key={`${c.name}-${i}`}
                    className="flex items-center justify-between gap-3 border-b-[0.5px] border-white/8 px-4 py-3 text-sm last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-white/90">{c.name}</div>
                      <div className="mt-0.5 text-[11px] text-[#6d6860]">{c.role.replaceAll("_", " ")} · {c.ownershipPercentage}%</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${c.signed ? "bg-[#5fcf7e]/10 text-[#5fcf7e]" : "bg-[#faeeda] text-[#f0a832]"}`}>
                      {c.signed ? "Signed" : "Unsigned"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Add split form */}
            <div className="rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">Add split</div>
              <div className="mt-3 grid gap-2">
                <input
                  value={splitForm.name}
                  onChange={(e) => setSplitForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Collaborator name"
                  className="rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2 text-sm outline-none"
                />
                <div className="grid grid-cols-[1fr_0.8fr] gap-2">
                  <select
                    value={splitForm.role}
                    onChange={(e) => setSplitForm((c) => ({ ...c, role: e.target.value as typeof splitForm.role }))}
                    className="rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2 text-sm outline-none"
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
                    className="rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <button type="button" onClick={addSplit} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                  Add collaborator
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-[#6d6860]">{splitTotal}% assigned</span>
                <button type="button" onClick={copySplitSheet} className="text-xs text-[#f0a832]">
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
          <section id="metadata-panel" className="bg-transparent px-5 pb-5 text-white/90">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Metadata</div>
            <div className="rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[13px] font-medium text-white/90">{metadataIntelligence.score}% complete</div>
                <div className="text-[11px] text-white/45">
                  {song?.metadataComplete ? "Core release metadata is covered." : "Finish this before pitching and release week."}
                </div>
              </div>
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
                  <label key={key} className="block text-sm text-white/60">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/50">{label}</span>
                    <input
                      type={key === "releaseDate" ? "date" : "text"}
                      value={metadataForm[key as keyof typeof metadataForm]}
                      onChange={(e) => setMetadataForm((c) => ({ ...c, [key]: e.target.value }))}
                      className="h-10 w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={saveMetadata} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                  Save metadata
                </button>
                {metadataNotice ? (
                  <div className="rounded-lg border border-[#97c459]/30 bg-[#5fcf7e]/10 px-3 py-2 text-xs text-[#5fcf7e]">
                    {metadataNotice}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* Files */}
        <section id="files-panel" className="bg-transparent px-5 pb-5 text-white/90">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Files</div>
          <div className="rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] p-4">
            <div className="mb-4 overflow-hidden rounded-[18px] border-[0.5px] border-white/8 bg-[#11110f] text-white">
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
              <div className="mb-4 rounded-lg border border-[#ef9f27]/30 bg-[#faeeda] px-3 py-3 text-xs text-[#f0a832]">
                <div className="font-medium uppercase tracking-[0.14em]">Need in this room</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingCriticalKinds.map((kind) => (
                    <span key={kind} className="rounded-full border border-[#ef9f27]/25 bg-white/10 px-2.5 py-1 uppercase tracking-[0.12em]">
                      {kind === "split" ? "Split sheet" : kind}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-[#97c459]/30 bg-[#5fcf7e]/10 px-3 py-3 text-xs text-[#5fcf7e]">
                Core release files are covered in this room.
              </div>
            )}

            <div className="mb-4 grid gap-3 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-xl border-[0.5px] border-white/8 bg-white/5 px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Manager says</div>
                <div className="mt-2 text-sm leading-6 text-white/90">
                  {nextMissingKind
                    ? `Get the ${getAssetKindLabel(nextMissingKind).toLowerCase()} into this room next so the package is harder to break during release week.`
                    : "This room has the core release file set. From here, focus on cleaner versions, alternate artwork, and anything you might need on another device fast."}
                </div>
              </div>
              <div className="rounded-xl border-[0.5px] border-white/8 bg-white/5 px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Cross-device health</div>
                <div className="mt-2 text-sm leading-6 text-white/90">
                  {syncedAssets.length === 0
                    ? "Nothing here is safely available across devices yet. Syncing matters if you suddenly switch phones, laptops, or WiFi spots."
                    : syncedAssets.length === filedAssets.length
                      ? "Everything filed here is available cross-device. Good — this room is starting to behave like a real vault."
                      : `${syncedAssets.length} of ${filedAssets.length} filed item${filedAssets.length === 1 ? " is" : "s are"} safely synced across devices.`}
                </div>
              </div>
            </div>

            <label className="block rounded-lg border-[0.5px] border-dashed border-white/12 bg-white/5 px-4 py-4 text-sm text-white/60">
              <span className="block">Add essential files — master, stems, artwork, contracts</span>
              <span className="mt-1 block text-[11px] text-white/50">
                {signedIn ? "Uploads sync to your vault when storage is configured." : "Sign in to sync uploads across devices. For now this room will save file records on this device."}
              </span>
              <input type="file" multiple accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.wav,.mp3,.aiff,.zip" onChange={handleFileChange} className="mt-3 block w-full text-sm" />
            </label>
            {uploading && <div className="mt-3 text-sm text-white/60">Uploading to the vault…</div>}
            {uploadNotice && <div className="mt-3 rounded-lg border border-[#97c459]/30 bg-[#5fcf7e]/10 px-3 py-2 text-xs text-[#5fcf7e]">{uploadNotice}</div>}
            {uploadError && <div className="mt-3 rounded-lg border border-[#ef9f27]/30 bg-[#faeeda] px-3 py-2 text-xs text-[#f0a832]">{uploadError}</div>}
            {filedAssets.length === 0 ? (
              <div className="mt-3 rounded-xl border-[0.5px] border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-white/55">
                <div className="font-medium text-white/85">No files in this room yet.</div>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Start with the master, artwork, split sheet, or contract so this release is not trapped on one device or in scattered messages.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {orderedAssets.map((asset) => (
                  <div key={asset.id} className={`rounded-xl border-[0.5px] px-4 py-4 text-sm text-white/90 ${getAssetTone(asset.kind)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#6d6860]">{getAssetGlyph(asset.kind)}</span>
                          <span className="rounded-full border border-white/8 bg-white/70 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#6d6860]">
                            {getAssetKindLabel(asset.kind)}
                          </span>
                        </div>
                        <div className="mt-3 truncate text-[15px] font-medium text-white/90">{asset.name}</div>
                        <div className="mt-1 text-[11px] text-[#6d6860]">
                          {asset.sizeLabel} · {asset.source === "supabase" ? "Synced across devices" : "Saved on this device only"}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${asset.source === "supabase" ? "bg-[#5fcf7e]/10 text-[#5fcf7e]" : "bg-[#faeeda] text-[#f0a832]"}`}>
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
                            className="rounded-full border border-white/8 bg-white/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60 transition hover:border-white/12 disabled:opacity-50"
                          >
                            {assetActionId === asset.id ? "Opening…" : "Open"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void openVaultAsset(asset, true)}
                            disabled={assetActionId === asset.id}
                            className="rounded-full border border-white/8 bg-white/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60 transition hover:border-white/12 disabled:opacity-50"
                          >
                            Download
                          </button>
                        </>
                      ) : (
                        <span className="rounded-full border border-white/8 bg-white/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#6d6860]">
                          Upload from a signed-in session to sync
                        </span>
                      )}
                      <span className="rounded-full border border-white/8 bg-white/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#6d6860]">
                        Filed in room
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-transparent px-5 pb-5 text-white/90">
          <details className="overflow-hidden rounded-xl border-[0.5px] border-white/10 bg-white/[0.04]">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left marker:hidden list-none">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">More room tools</div>
                <div className="mt-1 text-sm text-white/80">Runway, pitch DNA, streaming stats, and promo tools</div>
              </div>
              <span className="text-xs text-white/40">Open →</span>
            </summary>
            <div className="border-t border-white/8">
              {/* Live stats from Songstats */}
              {song?.isrc && <SongstatsPanel isrc={song.isrc} spotifyArtistId={song.spotifyArtistId} />}

              {/* Streaming links across all DSPs via MusicFetch */}
              {song?.isrc && <MusicFetchPanel isrc={song.isrc} />}

              {/* Emotional Story — pitch DNA */}
              {song && (
                <section className="bg-transparent px-5 pb-5 pt-5 text-white/90">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Emotional story</div>
                  <div className="rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] p-4">
                    <p className="mb-3 text-[11px] leading-5 text-white/50">
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
                      <Link href="/pitch-kits" className="rounded-lg border-[0.5px] border-white/10 px-4 py-2 text-sm text-white/60">
                        Pitch kit
                      </Link>
                    </div>
                  </div>
                </section>
              )}

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

                  <div className="relative mx-1 mb-5 h-[4px] rounded-full bg-[#1e1e1b]">
                    {(() => {
                      const total = runwayRows.length;
                      const lastDoneIdx = runwayRows.reduce((acc, row, i) => (row.status === "Done" ? i : acc), -1);
                      const fillPct = total > 1 && lastDoneIdx >= 0 ? (lastDoneIdx / (total - 1)) * 100 : 0;
                      return (
                        <>
                          <div className="h-full rounded-full bg-[#5fcf7e] transition-all duration-700" style={{ width: `${fillPct}%` }} />
                          {runwayRows.map((row, i) => {
                            const left = total > 1 ? (i / (total - 1)) * 100 : 0;
                            const isDone = row.status === "Done";
                            const isDue = row.status === "Due now";
                            return (
                              <div
                                key={row.title}
                                className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                                  isDone ? "bg-[#5fcf7e]" : isDue ? "border-[1.5px] border-white/70 bg-transparent" : "border-[1.5px] border-white/25 bg-transparent"
                                }`}
                                style={{ left: `${left}%` }}
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

                  <div className="space-y-0">
                    {runwayRows.map((row) => {
                      const isDone = row.status === "Done";
                      const isDue = row.status === "Due now";
                      return (
                        <div key={`${row.title}-${row.daysBefore}`} className="flex items-start gap-3 border-b-[0.5px] border-white/[0.05] py-3 last:border-b-0">
                          <div className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[9px] ${
                            isDone ? "bg-[#5fcf7e]/10 text-[#5fcf7e]" : isDue ? "bg-[#2a1800] text-[#ef9f27]" : "bg-white/5 text-white/30"
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

              {missingItems.length > 0 && (
                <section className="bg-transparent px-5 pb-5 text-white/90">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">What am I missing?</div>
                  <div className="overflow-hidden rounded-xl border-[0.5px] border-[#e24b4a]/30 bg-[#f05c5c]/10">
                    {missingItems.map((item, i) => (
                      <div
                        key={item}
                        className={`flex items-center gap-3 px-4 py-3 text-sm ${i < missingItems.length - 1 ? "border-b-[0.5px] border-[#e24b4a]/15" : ""}`}
                      >
                        <span className="size-1.5 shrink-0 rounded-full bg-[#e24b4a]" />
                        <span className="text-[#f05c5c]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-white/50">
                    Fix these before pitching or releasing.
                  </p>
                </section>
              )}

              {song ? (
                <div className="flex flex-wrap gap-3 bg-transparent px-5 pb-5 text-white/90">
                  <Link href="/signal" className="flex rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
                    Create promo →
                  </Link>
                  <Link href="/epk" className="flex rounded-lg border-[0.5px] border-white/10 px-5 py-3 text-sm font-medium text-white/90">
                    Build EPK
                  </Link>
                </div>
              ) : null}
            </div>
          </details>
        </section>
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
      {fixModal && song && (() => {
        const needsIsrc = !song.isrc && ["soundexchange", "mlc", "ascap", "bmi", "sesac"].includes(
          COLLECTION_BODY_TO_PLATFORM[fixModal.collectionBody] ?? ""
        );
        return (
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
            songId={song.id}
            songTitle={song.title}
            open={fixModal !== null}
            onClose={() => setFixModal(null)}
            verificationField={needsIsrc ? {
              label: "ISRC code",
              placeholder: "e.g. USRC12345678",
              pattern: /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/i,
            } : undefined}
            onComplete={(isrcValue) => {
              completeRevenueAction(song.id, fixModal.streamType, fixModal.collectionBody);
              if (isrcValue && needsIsrc) {
                updateSongMetadata(song.id, { isrc: isrcValue.toUpperCase() });
              }
              setFixModal(null);
            }}
          />
        );
      })()}
    </AppShell>
  );
}

function ActionJumpCard({
  label,
  value,
  detail,
  href,
  cta,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
  cta: string;
  tone: "warning" | "neutral" | "success";
}) {
  const toneClass = tone === "warning"
    ? "border-[#ef9f27]/25 bg-[#ef9f27]/10"
    : tone === "success"
      ? "border-[#97c459]/25 bg-[#97c459]/10"
      : "border-white/10 bg-white/5";

  return (
    <a href={href} className={`rounded-2xl border px-4 py-4 transition hover:bg-white/10 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-2 text-xl font-medium text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/55">{detail}</div>
      <div className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-white/75">{cta}</div>
    </a>
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
        className="w-full resize-none rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30"
      />
      <button
        type="button"
        onClick={save}
        className="mt-2 rounded-lg border-[0.5px] border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60"
      >
        {saved ? "Saved ✓" : "Save story"}
      </button>
    </div>
  );
}

type StreamingLinks = Record<string, { url?: string; label?: string }>;

function MusicFetchPanel({ isrc }: { isrc: string }) {
  const [links, setLinks] = useState<StreamingLinks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/odesli?isrc=${encodeURIComponent(isrc)}`);
        if (!cancelled) {
          if (!res.ok) { setLoading(false); return; }
          const data = await res.json() as { services?: StreamingLinks };
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
    <section className="bg-transparent px-5 pb-5 text-white/90">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Streaming links</div>
      <div className="rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] p-4">
        {loading && <div className="text-sm text-white/50">Finding links…</div>}
        {!loading && activeLinks.length === 0 && (
          <div className="text-sm text-white/50">No links found yet — ISRC resolves once the release goes live.</div>
        )}
        {!loading && activeLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeLinks.map(({ key, label, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border-[0.5px] border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:border-white/20"
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
    <section className="bg-transparent px-5 pb-5 text-white/90">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Live stats</div>
      <div className="rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] p-4">
        {loading && <div className="text-sm text-white/50">Loading live data…</div>}
        {error && <div className="text-sm text-[#e24b4a]">Could not load stats: {error}</div>}
        {!loading && !error && sources.length === 0 && !radioPlays && (
          <div className="text-sm text-white/50">No data yet — stats appear once the song is live on DSPs and SONGSTATS_API_KEY is set.</div>
        )}
        {!loading && (sources.length > 0 || radioPlays !== undefined) && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg glass-subtle px-3 py-3 text-center">
              <div className="text-[18px] font-medium text-white/90">{fmt(totalStreams)}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/50">Total streams</div>
            </div>
            <div className="rounded-lg glass-subtle px-3 py-3 text-center">
              <div className="text-[18px] font-medium text-white/90">{fmt(totalPlaylists)}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/50">Playlists</div>
            </div>
            <div className="rounded-lg glass-subtle px-3 py-3 text-center">
              <div className="text-[18px] font-medium text-white/90">{fmt(radioPlays)}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/50">Radio spins</div>
            </div>
          </div>
        )}
        {!loading && sources.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {sources.map((s) => (
              <div key={s.source} className="flex items-center justify-between rounded-lg glass-subtle px-3 py-2 text-sm">
                <span className="capitalize text-white/60">{s.source}</span>
                <span className="font-medium text-white/90">{fmt(s.total_streams)} streams</span>
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
    <div className="rounded-xl border-[0.5px] border-white/10 bg-white/[0.05] px-4 py-3 text-sm">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">{label}</div>
      <div className="mt-1.5 leading-6 text-white/90">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "collecting" || status === "connected") return "bg-[#97c459]/25 text-[#5fcf7e]";
  if (status === "registered_not_collecting" || status === "incomplete") return "bg-[#ef9f27]/20 text-[#f0a832]";
  return "bg-[#e24b4a]/15 text-[#f05c5c]";
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
      return "border-[#97c459]/30 bg-[#97c459]/[0.06]";
    case "artwork":
      return "border-[#c7a6ff]/35 bg-[#c7a6ff]/[0.06]";
    case "split":
      return "border-[#ef9f27]/30 bg-[#ef9f27]/[0.06]";
    case "contract":
      return "border-[#7dc4ff]/30 bg-[#7dc4ff]/[0.06]";
    default:
      return "border-white/8 bg-white/[0.04]";
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
