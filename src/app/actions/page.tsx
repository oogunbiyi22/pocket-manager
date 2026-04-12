"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getRevenueActionQueue } from "@/lib/backstage-data";

export default function ActionsPage() {
  const { completeRevenueAction, songs } = usePocket();
  const queue = getRevenueActionQueue(songs);

  return (
    <AppShell title="Action Queue" eyebrow="Pro preview">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Next Action Engine</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">One action is free. The full queue is Pro.</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Pocket sorts gaps by value, ease, and platform importance. Free users see the top action; Pro unlocks the whole queue.
          </p>
        </section>

        <section className="mt-5 space-y-3">
          {queue.length ? (
            queue.map((item, index) => {
              const locked = index > 0;

              return (
                <article key={item.id} className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6b65]">
                        {locked ? "Locked Pro action" : "Top free action"}
                      </div>
                      <h3 className="mt-2 text-lg font-normal text-[#111]">{locked ? "Upgrade to reveal next action" : item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#514d47]">
                        {locked ? "The next prioritized action stays hidden on Free." : item.reason}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#faeeda] px-3 py-1 text-[11px] font-medium text-[#854f0b]">
                      {locked ? "Pro" : formatGapEstimate(item.estimatedValue)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {locked ? (
                      <Link href="/settings" className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                        Start Pro trial
                      </Link>
                    ) : (
                      <>
                        <Link href={`/projects/${item.songId}`} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                          Start
                        </Link>
                        <button
                          type="button"
                          onClick={() => completeRevenueAction(item.songId, item.streamType, item.collectionBody)}
                          className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]"
                        >
                          Mark done
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-xl border-[0.5px] border-dashed border-black/20 bg-[#f8f6f1] p-4 text-sm text-[#6b6b65]">
              No pending revenue actions.
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
