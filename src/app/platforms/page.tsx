"use client";

import { AppShell } from "@/components/app-shell";
import { seedPlatformConnections } from "@/lib/backstage-data";

export default function PlatformsPage() {
  const groups = ["Distributor", "PRO", "Digital Performance", "Publishing", "Content ID", "Analytics"] as const;

  return (
    <AppShell title="Platforms" eyebrow="Connection status">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-[#f4f1eb] p-5 text-[#111]">
        <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Platform setup</div>
          <div className="mt-3 text-3xl font-normal tracking-[-0.03em]">Know what is connected.</div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Pocket checks each royalty path one by one. There is no connect-all button because each platform controls a different money path.
          </p>
        </div>

        <div className="mt-5 space-y-6">
          {groups.map((group) => {
            const platforms = seedPlatformConnections.filter((platform) => platform.group === group);

            if (!platforms.length) {
              return null;
            }

            return (
              <section key={group}>
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">{group}</div>
                <div className="space-y-3">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[15px] text-[#111]">{platform.name}</div>
                          <div className="mt-1 text-xs text-[#6d6860]">{platform.method}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${platformStatusClass(platform.status)}`}>
                          {platform.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[#514d47]">
                        <span>{platform.missingStep}</span>
                        <a
                          href={platformActionUrl(platform.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border-[0.5px] border-black/15 px-3 py-2 text-xs text-[#111] transition duration-200 ease-out hover:bg-[#f4f1eb]"
                        >
                          {platform.status === "connected" ? "Review" : "Fix"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}

function platformStatusClass(status: "connected" | "not_connected" | "incomplete") {
  if (status === "connected") return "bg-[#97c459]/25 text-[#3b6d11]";
  if (status === "incomplete") return "bg-[#ef9f27]/20 text-[#854f0b]";
  return "bg-[#e24b4a]/15 text-[#a32d2d]";
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
  };

  return urls[platformId] ?? "https://www.google.com/search?q=music+royalty+registration";
}
