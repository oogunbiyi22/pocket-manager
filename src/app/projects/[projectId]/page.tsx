"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChangeEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  formatMoney,
  formatGapEstimate,
  getMetadataIntelligence,
  getProjectById,
  getRevenueEstimateMethodology,
  getSongConfirmedIncome,
  getSongEstimatedGap,
  getSongReadinessChecklist,
  getSongReadinessScore,
  getWhatAmIMissing,
  releaseRadarMilestones,
} from "@/lib/backstage-data";
import { usePocket } from "@/components/pocket-provider";

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
  const { addSongCollaborator, completeRevenueAction, projects, songs, updateSongMetadata } = usePocket();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const song = songs.find((item) => item.id === projectId);
  const fallbackProject = getProjectById(projectId, projects);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
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
  const splitTotal = song?.collaborators.reduce((total, collaborator) => total + collaborator.ownershipPercentage, 0) ?? 0;
  const unsignedSplits = song?.collaborators.filter((collaborator) => !collaborator.signed).length ?? 0;
  const splitSheetText = useMemo(() => {
    if (!song) return "";
    return [
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
      "This prototype preview is not a signed legal agreement.",
    ].join("\n");
  }, [song, splitTotal]);

  if (!song && !fallbackProject) notFound();

  const title = song?.title ?? fallbackProject?.name ?? "Song";
  const readinessScore = song ? getSongReadinessScore(song) : 0;
  const estimatedGap = song ? getSongEstimatedGap(song) : 0;
  const confirmedIncome = song ? getSongConfirmedIncome(song) : 0;
  const registrationRows = song?.revenueStreams ?? [];
  const readinessChecklist = song ? getSongReadinessChecklist(song) : [];
  const metadataIntelligence = song ? getMetadataIntelligence(song) : null;
  const blockingCount = readinessChecklist.filter((item) => !item.done).length;
  const runwayRows = song ? getRunwayRows(song.releaseDate) : [];
  const missingItems = fallbackProject ? getWhatAmIMissing(fallbackProject) : [];

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).map((file) => file.name);
    setUploadedFiles((current) => [...files, ...current].slice(0, 6));
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

  return (
    <AppShell title={title} eyebrow="The Room">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">

        {/* Cover art header */}
        <section className="bg-[#1e1e1b] px-5 py-5">
          <div className="flex items-end gap-4">
            <div className="grid size-20 shrink-0 place-items-center rounded-xl border-[0.5px] border-white/10 bg-[#33332f] text-[11px] uppercase tracking-[0.16em] text-white/25">
              Art
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The Room</div>
              <h2 className="mt-2 truncate text-3xl font-light tracking-[-0.03em] text-white">{title}</h2>
              <p className="mt-2 text-sm text-white/35">
                {song
                  ? `${song.isrc} · ${song.releaseDate} · ${song.territory}`
                  : "Add ISRC and platform registrations next."}
              </p>
            </div>
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
                          onClick={() => completeRevenueAction(song.id, stream.streamType, stream.collectionBody)}
                          className="ml-auto rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[#0d0d0b]"
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

        {/* Files */}
        <section className="bg-white px-5 pb-5 text-[#111]">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Files</div>
          <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
            <label className="block rounded-lg border-[0.5px] border-dashed border-black/25 bg-white px-4 py-4 text-sm text-[#514d47]">
              <span className="block">Add essential files — master, stems, artwork, contracts</span>
              <input type="file" multiple onChange={handleFileChange} className="mt-3 block w-full text-sm" />
            </label>
            {[...(song?.artworkUploaded ? ["Artwork uploaded"] : []), ...uploadedFiles].map((file) => (
              <div key={file} className="mt-2 rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm text-[#111]">
                {file}
              </div>
            ))}
          </div>
        </section>

        {/* The Runway */}
        {song && runwayRows.length ? (
          <section className="bg-white px-5 pb-5 text-[#111]">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">The Runway</div>
            <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1]">
              {runwayRows.slice(0, 5).map((row) => (
                <div key={`${row.title}-${row.daysBefore}`} className="flex items-start justify-between gap-3 border-b-[0.5px] border-black/10 px-4 py-3 text-sm last:border-b-0">
                  <div>
                    <div className="font-medium text-[#111]">{row.title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#6d6860]">{row.detail}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${runwayStatusClass(row.status)}`}>
                    {row.status}
                  </span>
                </div>
              ))}
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
    </AppShell>
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

function runwayStatusClass(status: "Done" | "Due now" | "Upcoming" | "Missed") {
  if (status === "Done") return "bg-[#eaf3de] text-[#3b6d11]";
  if (status === "Due now") return "bg-[#faeeda] text-[#854f0b]";
  if (status === "Missed") return "bg-[#fcebeb] text-[#a32d2d]";
  return "bg-white text-[#6d6860]";
}
