"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

export default function VaultPage() {
  const { songs } = usePocket();
  const songFiles = songs.flatMap((song) => [
    { id: `${song.id}-master`, songId: song.id, songTitle: song.title, name: `${song.title} master WAV`, type: "Master" },
    { id: `${song.id}-artwork`, songId: song.id, songTitle: song.title, name: `${song.title} artwork`, type: "Artwork" },
    { id: `${song.id}-split`, songId: song.id, songTitle: song.title, name: `${song.title} split sheet`, type: "Split" },
  ]);

  return (
    <AppShell title="The Vault" eyebrow="Protected memory">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">The Vault</div>
          <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">The files your career depends on.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Masters, artwork, contracts, statements, split sheets, and brand assets belong here. Song files still open back into the Room.
          </p>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
          <label className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]" htmlFor="vault-search">
            Search vault
          </label>
          <input
            id="vault-search"
            placeholder="Search masters, statements, split sheets"
            className="mt-3 h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm outline-none"
          />
        </section>

        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Linked files</div>
          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0]">
            {songFiles.map((file) => (
              <Link
                key={file.id}
                href={`/projects/${file.songId}`}
                className="grid gap-2 border-b-[0.5px] border-black/10 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_0.5fr_0.8fr]"
              >
                <div className="text-[#111]">{file.name}</div>
                <div className="text-[#6b6b65]">{file.type}</div>
                <div className="text-[#6b6b65]">{file.songTitle}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#854f0b]">
          Upload, R2 storage, and full file search are backend-backed Phase 8 work. This page locks the product shape now: The Vault is protected creative memory, not a generic drive.
        </section>
      </main>
    </AppShell>
  );
}
