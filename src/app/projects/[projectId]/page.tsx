"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  formatMoney,
  formatGapEstimate,
  getMetadataIntelligence,
  getProjectById,
  getSongConfirmedIncome,
  getSongEstimatedGap,
  getSongGapScore,
  getSongReadinessChecklist,
  getSongReadinessScore,
} from "@/lib/backstage-data";
import { usePocket } from "@/components/pocket-provider";

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

  if (!song && !fallbackProject) {
    notFound();
  }

  const title = song?.title ?? fallbackProject?.name ?? "Song";
  const readinessScore = song ? getSongReadinessScore(song) : 0;
  const estimatedGap = song ? getSongEstimatedGap(song) : 0;
  const confirmedIncome = song ? getSongConfirmedIncome(song) : 0;
  const gapScore = song ? getSongGapScore(song) : 100;
  const registrationRows = song?.revenueStreams ?? [];
  const readinessChecklist = song ? getSongReadinessChecklist(song) : [];
  const metadataIntelligence = song ? getMetadataIntelligence(song) : null;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).map((file) => file.name);
    setUploadedFiles((current) => [...files, ...current].slice(0, 6));
  }

  function addSplit() {
    if (!song || !splitForm.name.trim()) {
      return;
    }

    addSongCollaborator(song.id, {
      name: splitForm.name,
      role: splitForm.role,
      ownershipPercentage: Number(splitForm.ownershipPercentage),
      signed: false,
    });
    setSplitForm({ name: "", role: "writer", ownershipPercentage: "0" });
  }

  function saveMetadata() {
    if (!song) {
      return;
    }

    updateSongMetadata(song.id, {
      ...metadataForm,
      bpm: metadataForm.bpm ? Number(metadataForm.bpm) : undefined,
    });
  }

  return (
    <AppShell title={title} eyebrow="Song room">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Release readiness</div>
              <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/58">
                {song ? `${song.isrc} · ${song.releaseDate} · ${song.territory}` : "Manual song added. Add ISRC and platform registrations next."}
              </p>
            </div>
            <div className="rounded-xl border-[0.5px] border-white/15 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Score</div>
              <div className="mt-1 text-4xl font-normal">{readinessScore}/100</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Total secured" value={formatMoney(confirmedIncome)} />
            <Metric label="Estimated missing" value={formatGapEstimate(estimatedGap)} amber />
            <Metric label="Gap score" value={`${gapScore}%`} />
          </div>
        </section>

        {song ? (
          <>
            <section className="mt-5">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Revenue gap breakdown</div>
              <div className="space-y-3">
                {registrationRows.map((stream) => (
                  <article key={`${stream.streamType}-${stream.collectionBody}`} className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[15px] font-normal text-[#111]">{stream.label}</h3>
                        <p className="mt-1 text-xs text-[#6d6860]">{stream.collectionBody}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${statusClass(stream.status)}`}>
                        {stream.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-3 text-sm">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#6d6860]">Collected</div>
                        <div className="mt-1">{formatMoney(stream.actualAmount)}</div>
                      </div>
                      <div className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-3 text-sm">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#6d6860]">Estimated gap</div>
                        <div className="mt-1">{formatGapEstimate(stream.estimatedGap)}</div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#514d47]">Reason: {stream.reason}</p>
                    {stream.estimatedGap > 0 ? (
                      <p className="mt-2 text-xs leading-5 text-[#854f0b]">
                        Free tier shows a range. Upgrade to Pro for the exact estimate and full action queue.
                      </p>
                    ) : null}
                    <details className="mt-3 rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm text-[#514d47]">
                      <summary className="cursor-pointer list-none marker:hidden">How is this calculated?</summary>
                      <div className="mt-2 leading-6">{stream.rateNote}</div>
                    </details>

                    <button
                      type="button"
                      onClick={() => completeRevenueAction(song.id, stream.streamType, stream.collectionBody)}
                      className="mt-3 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white"
                    >
                      {stream.action}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Readiness checklist</div>
                <div className="space-y-3">
                  {readinessChecklist.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-sm">
                      <div>
                        <div className="text-[#111]">{item.label}</div>
                        <div className="mt-1 text-xs text-[#6d6860]">{item.points} readiness points</div>
                      </div>
                      <Link href={item.href} className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.done ? statusClass("connected") : statusClass("not_registered")}`}>
                        {item.done ? "Done" : item.action}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Song details</div>
                <div className="space-y-3">
                  <Detail label="Collaborators" value={song.collaborators.map((item) => `${item.name} ${item.ownershipPercentage}%`).join(" · ")} />
                  <Detail label="Distribution" value={song.distributionPlatforms.join(" · ")} />
                  <Detail label="Metadata" value={song.metadataComplete ? "Complete" : "Incomplete"} />
                  <Detail label="Split sheet" value={song.splitSheetSigned ? "Signed" : "Needs signatures"} />
                </div>
                <div className="mt-3 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">Add split</div>
                  <div className="mt-3 grid gap-2">
                    <input
                      value={splitForm.name}
                      onChange={(event) => setSplitForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Collaborator name"
                      className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2 text-sm outline-none"
                    />
                    <div className="grid grid-cols-[1fr_0.8fr] gap-2">
                      <select
                        value={splitForm.role}
                        onChange={(event) =>
                          setSplitForm((current) => ({
                            ...current,
                            role: event.target.value as typeof splitForm.role,
                          }))
                        }
                        className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2 text-sm outline-none"
                      >
                        {["writer", "producer", "featured_artist", "master_owner"].map((role) => (
                          <option key={role} value={role}>
                            {role.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                      <input
                        value={splitForm.ownershipPercentage}
                        onChange={(event) => setSplitForm((current) => ({ ...current, ownershipPercentage: event.target.value }))}
                        inputMode="decimal"
                        placeholder="Percent"
                        className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <button type="button" onClick={addSplit} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                      Add collaborator
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {metadataIntelligence ? (
              <section className="mt-5">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Metadata intelligence</div>
                <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[15px] font-medium text-[#111]">{metadataIntelligence.score}% complete</div>
                      <p className="mt-2 text-sm leading-6 text-[#514d47]">
                        Missing metadata can block royalty routing, playlist context, sync matching, and future promo generation.
                      </p>
                    </div>
                    <Link href="/settings" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
                      Pro suggestions
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {metadataIntelligence.checks.map((check) => (
                      <div key={check.label} className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#111]">{check.label}</span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${check.done ? statusClass("connected") : statusClass("incomplete")}`}>
                            {check.done ? "Set" : "Missing"}
                          </span>
                        </div>
                        {!check.done ? <p className="mt-2 text-xs leading-5 text-[#6b6b65]">{check.suggestion}</p> : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                        <span className="mb-2 block">{label}</span>
                        <input
                          type={key === "releaseDate" ? "date" : "text"}
                          value={metadataForm[key as keyof typeof metadataForm]}
                          onChange={(event) =>
                            setMetadataForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
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
          </>
        ) : (
          <section className="mt-5 rounded-xl border-[0.5px] border-[#ef9f27]/50 bg-[#ef9f27]/20 p-4 text-[#854f0b]">
            Add an ISRC or connect one platform so Pocket can calculate the first estimated revenue gap. It never shows a blank or fake zero state.
          </section>
        )}

        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Files</div>
          <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
            <p className="text-sm leading-6 text-[#514d47]">
              Keep only release essentials here: master file, stems, artwork, and contracts.
            </p>
            <label className="mt-4 block rounded-lg border-[0.5px] border-dashed border-black/25 bg-white px-4 py-4 text-sm text-[#514d47]">
              <span className="block">Add essential files</span>
              <input type="file" multiple onChange={handleFileChange} className="mt-3 block w-full text-sm" />
            </label>
            <div className="mt-4 space-y-2">
              {[...(song?.artworkUploaded ? ["Artwork uploaded"] : []), ...uploadedFiles].map((file) => (
                <div key={file} className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm text-[#111]">
                  {file}
                </div>
              ))}
            </div>
          </div>
        </section>

        {song ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/studio" className="flex rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
              Create promo content
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

function Metric({ label, value, amber = false }: { label: string; value: string; amber?: boolean }) {
  return (
    <div className={`rounded-lg border-[0.5px] px-4 py-3 ${amber ? "border-[#ef9f27]/50 bg-[#ef9f27] text-[#854f0b]" : "border-white/15 text-white"}`}>
      <div className="text-[11px] uppercase tracking-[0.18em] opacity-65">{label}</div>
      <div className="mt-1 text-2xl font-normal">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-sm">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">{label}</div>
      <div className="mt-2 leading-6 text-[#111]">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "collecting" || status === "connected") return "bg-[#97c459]/25 text-[#3b6d11]";
  if (status === "registered_not_collecting" || status === "incomplete") return "bg-[#ef9f27]/20 text-[#854f0b]";
  return "bg-[#e24b4a]/15 text-[#a32d2d]";
}
