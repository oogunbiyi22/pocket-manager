"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getSongEstimatedGap, getSongReadinessScore } from "@/lib/backstage-data";

export default function PitchKitsPage() {
  const { profile, songs } = usePocket();
  const [songId, setSongId] = useState(songs[0]?.id ?? "");
  const [recipient, setRecipient] = useState("Playlist curator");
  const [contact, setContact] = useState("booking@pocketmanager.app");
  const song = songs.find((item) => item.id === songId) ?? songs[0];
  const pitchText = useMemo(() => {
    if (!song) {
      return "Add a song before creating a pitch kit.";
    }

    return [
      `Subject: ${profile.artistName} - ${song.title}`,
      "",
      `Hi ${recipient},`,
      "",
      `I'm sharing "${song.title}", a ${song.genre ?? "genre-needed"} release from ${profile.artistName}.`,
      `Mood: ${song.mood ?? "needed"}. BPM: ${song.bpm ?? "needed"}. Key: ${song.musicalKey ?? "needed"}.`,
      `Release date: ${song.releaseDate}. Territory: ${song.territory}.`,
      "",
      `Catalog readiness: ${getSongReadinessScore(song)}/100. Estimated registration gap in Pocket Manager: ${formatGapEstimate(getSongEstimatedGap(song))}.`,
      "",
      `Contact: ${contact}`,
      "",
      "Review this before sending. Keep it specific, short, and tied to the song's actual metadata.",
    ].join("\n");
  }, [contact, profile.artistName, recipient, song]);

  return (
    <AppShell title="Pitch Kit" eyebrow="Signal">
      <main className="mx-auto max-w-5xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f5f4f0] text-[#111]">
        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Outreach package</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">Turn catalog data into a focused pitch.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Choose the song, choose the target, then send a pitch that uses the record's real metadata instead of generic artist copy.
          </p>
        </section>

        <section className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Pitch inputs</div>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Song</span>
                <select
                  value={songId}
                  onChange={(event) => setSongId(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                >
                  {songs.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm text-[#514d47]">
                <span className="mb-2 block">Recipient</span>
                <select
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                >
                  {["Playlist curator", "Music blog", "Sync supervisor", "Label A&R", "Booking agent"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm text-[#514d47]">
                <span className="mb-2 block">Contact</span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                />
              </label>
            </div>

            {song ? (
              <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Song facts</div>
                <div className="mt-3 grid gap-2 text-sm">
                  <Fact label="Readiness" value={`${getSongReadinessScore(song)}/100`} />
                  <Fact label="Estimated gap" value={formatGapEstimate(getSongEstimatedGap(song))} />
                  <Fact label="Metadata" value={song.metadataComplete ? "Complete" : "Incomplete"} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Pitch preview</div>
            <pre className="mt-4 min-h-96 whitespace-pre-wrap rounded-xl border-[0.5px] border-black/10 bg-white p-4 text-sm leading-6 text-[#514d47]">
              {pitchText}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/epk" className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Open EPK
              </Link>
              <Link href={song ? `/projects/${song.id}` : "/projects"} className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
                Open song
              </Link>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2">
      <span className="text-[#6b6b65]">{label}</span>
      <span className="text-[#111]">{value}</span>
    </div>
  );
}
