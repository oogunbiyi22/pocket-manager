"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";

export default function SettingsPage() {
  const { platformConnections, profile, signedIn, signOut, songs } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const connected = platformConnections.filter((platform) => platform.status === "connected").length;
  const incomplete = platformConnections.filter((platform) => platform.status !== "connected").length;
  const gapsClosed = songs.flatMap((song) => song.revenueStreams).filter((stream) => stream.status === "collecting").length;

  return (
    <AppShell title="Profile" eyebrow="Operations">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Artist profile</div>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">{profile.artistName}</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                {profile.role} · Free tier · 3-song starter catalog
              </p>
            </div>
            <div className="rounded-xl border-[0.5px] border-white/15 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">The Gap</div>
              <div className="mt-1 text-3xl font-normal">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <ProfileMetric label="Songs tracked" value={`${summary.totalSongs}/3`} />
          <ProfileMetric label="Platforms ready" value={`${connected}/${platformConnections.length}`} />
          <ProfileMetric label="Gaps closed" value={`${gapsClosed}`} />
        </section>

        <section className="mt-5 grid gap-3">
          <ProfileLink
            href="/platforms"
            title="Platform connections"
            detail={`${connected} connected · ${incomplete} need attention`}
            body="Distributor, PRO, SoundExchange, MLC, YouTube, Spotify, and Apple Music status."
          />
          <ProfileLink
            href="/notifications"
            title="Notifications"
            detail="Gap alerts · Runway checkpoints · platform issues"
            body="Choose the alerts that reduce confusion and keep the creator moving."
          />
          <ProfileLink
            href="/guild"
            title="The Guild"
            detail="Opt-in collaboration network"
            body="Find collaborators without turning the app into a public social feed."
          />
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Subscription</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Free shows gap ranges, one next action, and a 3-song starter catalog. Pro unlocks exact Gap estimates, unlimited songs, full queue, Signal, Harvest exports, and A.
          </p>
          <button type="button" className="mt-4 rounded-lg bg-[#0d0d0b] px-4 py-2 text-sm text-white">
            Start 7-day Pro trial
          </button>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#854f0b]">
          Work, Signal, and Harvest now hold the feature surfaces. Profile stays focused on the account layer so the app does not become dashboard soup.
        </section>

        {signedIn ? (
          <button type="button" onClick={signOut} className="mt-5 rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
            Sign out
          </button>
        ) : null}
      </main>
    </AppShell>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] px-4 py-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">{label}</div>
      <div className="mt-2 text-2xl font-normal text-[#111]">{value}</div>
    </div>
  );
}

function ProfileLink({ href, title, detail, body }: { href: string; title: string; detail: string; body: string }) {
  return (
    <Link href={href} className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 transition hover:border-black/35">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[15px] font-medium text-[#111]">{title}</div>
          <p className="mt-2 text-sm leading-6 text-[#514d47]">{body}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#6b6b65]">{detail}</span>
      </div>
    </Link>
  );
}
