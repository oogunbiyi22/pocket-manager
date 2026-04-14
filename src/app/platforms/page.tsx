"use client";

import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";

const PLATFORM_GAP_LABELS: Record<string, { streamLabel: string; gapHint: string }> = {
  distrokid: { streamLabel: "Streaming royalties", gapHint: "Base streaming income path" },
  tunecore: { streamLabel: "Streaming royalties", gapHint: "Base streaming income path" },
  cdbaby: { streamLabel: "Streaming royalties", gapHint: "Distribution alternative" },
  ascap: { streamLabel: "Performance royalties", gapHint: "Writer performance backend" },
  bmi: { streamLabel: "Performance royalties", gapHint: "Writer performance backend" },
  sesac: { streamLabel: "Performance royalties", gapHint: "Writer performance backend" },
  soundexchange: { streamLabel: "Digital performance royalties", gapHint: "Master/artist SoundExchange path" },
  mlc: { streamLabel: "Mechanical royalties", gapHint: "Digital mechanical collection" },
  youtube: { streamLabel: "YouTube Content ID", gapHint: "UGC claim protection" },
  spotify: { streamLabel: "Analytics", gapHint: "Streaming data visibility" },
  apple_music: { streamLabel: "Analytics", gapHint: "Apple analytics access" },
};

export default function PlatformsPage() {
  const { platformConnections, songs, updatePlatformConnection } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const groups = ["Distributor", "PRO", "Digital Performance", "Publishing", "Content ID", "Analytics"] as const;

  const connectedCount = platformConnections.filter((p) => p.status === "connected").length;
  const totalCount = platformConnections.length;
  const connectionPct = Math.round((connectedCount / totalCount) * 100);

  return (
    <AppShell title="Platforms" eyebrow="Connection status">
      <main className="mx-auto max-w-3xl space-y-5 text-[#111]">
        {/* Command surface */}
        <section className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#0d0d0b] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Platform connections</div>
          <div className="mt-3 text-[40px] font-light leading-none tracking-[-0.04em]">
            {connectedCount} <span className="text-[24px] text-white/35">of {totalCount}</span>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#97c459] transition-all duration-500"
              style={{ width: `${connectionPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/35">
            <span>{connectionPct}% connected</span>
            {summary.totalEstimatedGap > 0 ? (
              <span>{formatGapEstimate(summary.totalEstimatedGap)} catalog gap open</span>
            ) : (
              <span>Catalog fully connected</span>
            )}
          </div>
          <p className="mt-4 text-sm leading-6 text-white/45">
            Each platform controls a different royalty path. There is no connect-all — every integration is a separate money door.
          </p>
        </section>

        {/* Groups */}
        {groups.map((group) => {
          const platforms = platformConnections.filter((p) => p.group === group);
          if (!platforms.length) return null;

          return (
            <section key={group} className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-white">
              <div className="border-b border-black/[0.06] px-5 py-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">{group}</div>
              </div>
              <div className="divide-y divide-black/[0.06]">
                {platforms.map((platform) => {
                  const meta = PLATFORM_GAP_LABELS[platform.id];

                  return (
                    <div key={platform.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[15px] font-normal text-[#111]">{platform.name}</div>
                          <div className="mt-0.5 text-[11px] text-[#9a9a8a]">
                            {meta?.streamLabel ?? group} · {platform.method}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${platformStatusClass(platform.status)}`}>
                          {platform.status.replaceAll("_", " ")}
                        </span>
                      </div>

                      {platform.status !== "connected" && meta && (
                        <div className="mt-2 rounded-lg bg-[#faeeda] px-3 py-2 text-[12px] text-[#854f0b]">
                          {meta.gapHint} — not connected means royalties from this path may be uncollected
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {platform.status !== "connected" && (
                          <span className="flex-1 text-xs text-[#6d6860]">{platform.missingStep}</span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            updatePlatformConnection(
                              platform.id,
                              platform.status === "connected" ? "not_connected" : "connected",
                            )
                          }
                          className={`rounded-lg border-[0.5px] px-3 py-1.5 text-xs transition ${
                            platform.status === "connected"
                              ? "border-[#97c459]/50 bg-[#eaf3de] text-[#3b6d11]"
                              : "border-black/15 bg-[#f5f4f0] text-[#111] hover:bg-[#ebe9e4]"
                          }`}
                        >
                          {platform.status === "connected" ? "Connected ✓" : "Mark connected"}
                        </button>
                        <a
                          href={platformActionUrl(platform.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-1.5 text-xs text-[#111] transition hover:bg-[#f5f4f0]"
                        >
                          {platform.status === "connected" ? "Review →" : "Open →"}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </AppShell>
  );
}

function platformStatusClass(status: "connected" | "not_connected" | "incomplete") {
  if (status === "connected") return "bg-[#eaf3de] text-[#3b6d11]";
  if (status === "incomplete") return "bg-[#faeeda] text-[#854f0b]";
  return "bg-[#fcebeb] text-[#a32d2d]";
}

function platformActionUrl(platformId: string) {
  const urls: Record<string, string> = {
    distrokid: "https://distrokid.com/",
    tunecore: "https://www.tunecore.com/",
    cdbaby: "https://cdbaby.com/",
    ascap: "https://www.ascap.com/",
    bmi: "https://www.bmi.com/",
    sesac: "https://www.sesac.com/",
    soundexchange: "https://www.soundexchange.com/",
    mlc: "https://www.themlc.com/",
    youtube: "https://studio.youtube.com/",
    spotify: "https://artists.spotify.com/",
    apple_music: "https://artists.apple.com/",
  };
  return urls[platformId] ?? "https://www.google.com/search?q=music+royalty+registration";
}
