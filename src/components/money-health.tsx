"use client";

/**
 * Money Health Dashboard
 * ──────────────────────
 * Shows every financial setup item for the artist — status, why it matters,
 * and a real action button for each one. No dead ends.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePocket } from "@/components/pocket-provider";
const ActionModal = dynamic(() => import("@/components/action-modal").then(m => ({ default: m.ActionModal })), { ssr: false });
import { MONEY_HEALTH_ITEMS, getPlatform } from "@/lib/platform-registry";
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";
import Link from "next/link";

type ItemStatus = "done" | "needs_attention" | "not_started";

function useMoneyHealth() {
  const { platformConnections, songs } = usePocket();
  const summary = getRevenueGapSummary(songs);

  function getStatus(itemId: string): ItemStatus {
    switch (itemId) {
      case "pro_registration": {
        const pros = ["ascap", "bmi", "sesac", "socan", "prs"];
        const anyConnected = pros.some(
          (id) => platformConnections.find((p) => p.id === id)?.status === "connected",
        );
        const anyIncomplete = pros.some(
          (id) => platformConnections.find((p) => p.id === id)?.status === "incomplete",
        );
        return anyConnected ? "done" : anyIncomplete ? "needs_attention" : "not_started";
      }
      case "soundexchange": {
        const se = platformConnections.find((p) => p.id === "soundexchange");
        return se?.status === "connected"
          ? "done"
          : se?.status === "incomplete"
          ? "needs_attention"
          : "not_started";
      }
      case "the_mlc": {
        const mlc = platformConnections.find((p) => p.id === "mlc");
        return mlc?.status === "connected"
          ? "done"
          : mlc?.status === "incomplete"
          ? "needs_attention"
          : "not_started";
      }
      case "publishing_admin": {
        const pub = platformConnections.find((p) => p.id === "songtrust" || p.id === "cdbaby");
        return pub?.status === "connected"
          ? "done"
          : pub?.status === "incomplete"
          ? "needs_attention"
          : "not_started";
      }
      case "distribution_payout": {
        const dists = ["distrokid", "tunecore", "cdbaby", "onerpm", "unitedmasters"];
        const anyConnected = dists.some(
          (id) => platformConnections.find((p) => p.id === id)?.status === "connected",
        );
        const anyIncomplete = dists.some(
          (id) => platformConnections.find((p) => p.id === id)?.status === "incomplete",
        );
        return anyConnected && !anyIncomplete
          ? "done"
          : anyConnected || anyIncomplete
          ? "needs_attention"
          : "not_started";
      }
      case "spotify_verified": {
        const sp = platformConnections.find((p) => p.id === "spotify");
        return sp?.status === "connected" ? "done" : "not_started";
      }
      case "apple_music_verified": {
        const am = platformConnections.find((p) => p.id === "apple_music");
        return am?.status === "connected" ? "done" : "not_started";
      }
      case "youtube_content_id": {
        const yt = platformConnections.find((p) => p.id === "youtube");
        return yt?.status === "connected" ? "done" : "not_started";
      }
      case "split_sheets": {
        const allSigned = songs.every((s) => s.splitSheetSigned);
        const anySigned = songs.some((s) => s.splitSheetSigned);
        return allSigned ? "done" : anySigned ? "needs_attention" : "not_started";
      }
      default:
        return "not_started";
    }
  }

  const items = MONEY_HEALTH_ITEMS.map((item) => ({
    ...item,
    status: getStatus(item.id),
    platform: item.platformId ? getPlatform(item.platformId) : undefined,
  }));

  const doneCount = items.filter((i) => i.status === "done").length;
  const needsCount = items.filter((i) => i.status === "needs_attention").length;
  const healthScore = Math.round((doneCount / items.length) * 100);

  return { items, doneCount, needsCount, healthScore, totalGap: summary.totalEstimatedGap };
}

function StatusIndicator({ status }: { status: ItemStatus }) {
  if (status === "done") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eaf3de] text-[11px] font-bold text-[#3b6d11]">
        ✓
      </span>
    );
  }
  if (status === "needs_attention") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#faeeda] text-[11px] font-bold text-[#854f0b]">
        !
      </span>
    );
  }
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[11px] text-[#9a9a8a]">
      –
    </span>
  );
}

export function MoneyHealth() {
  const { items, doneCount, needsCount, healthScore, totalGap } = useMoneyHealth();
  const { updatePlatformConnection } = usePocket();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const incomplete = items.filter((i) => i.status !== "done");
  const done = items.filter((i) => i.status === "done");

  function handleComplete(item: (typeof items)[number]) {
    if (item.platformId) {
      updatePlatformConnection(item.platformId, "connected");
    }
    setActiveModal(null);
  }

  const activeItem = items.find((i) => i.id === activeModal);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-6 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
          Money health
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <div className="text-[44px] font-light leading-none tracking-[-0.04em]">
              {healthScore}%
            </div>
            <div className="mt-2 text-sm text-white/45">
              {doneCount} of {items.length} setup items complete
            </div>
          </div>
          {needsCount > 0 && (
            <div className="rounded-2xl bg-[#faeeda]/15 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#faeeda]/70">Needs attention</div>
              <div className="mt-1 text-xl font-normal text-[#faeeda]">{needsCount} item{needsCount === 1 ? "" : "s"}</div>
            </div>
          )}
        </div>
        {totalGap > 0 && (
          <div className="mt-5 rounded-2xl bg-white/[0.07] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Estimated uncollected</div>
            <div className="mt-1 text-xl font-normal text-white/80">{formatGapEstimate(totalGap)}</div>
            <div className="mt-1 text-[11px] text-white/30">
              Based on your catalog streams and registration gaps. Conservative estimate.
            </div>
          </div>
        )}
      </div>

      {/* Incomplete items — the action center */}
      {incomplete.length > 0 && (
        <div className="overflow-hidden rounded-[24px] glass card-shadow">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Action required
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {incomplete.map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                <StatusIndicator status={item.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[15px] font-medium text-[var(--text-primary)]">{item.label}</div>
                    {item.status === "needs_attention" && (
                      <span className="rounded-full bg-[#faeeda] px-2 py-0.5 text-[10px] font-semibold text-[#854f0b]">
                        Incomplete
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-5 text-[var(--text-muted)]">{item.description}</p>
                </div>
                {item.id === "split_sheets" ? (
                  <Link
                    href="/projects"
                    className="shrink-0 rounded-xl bg-[var(--bg-dark)] px-4 py-2 text-[12px] font-semibold text-white press"
                  >
                    {item.actionLabel}
                  </Link>
                ) : item.id === "distribution_payout" ? (
                  <Link
                    href="/platforms"
                    className="shrink-0 rounded-xl bg-[var(--bg-dark)] px-4 py-2 text-[12px] font-semibold text-white press"
                  >
                    {item.actionLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveModal(item.id)}
                    className="shrink-0 rounded-xl bg-[var(--bg-dark)] px-4 py-2 text-[12px] font-semibold text-white press"
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done items */}
      {done.length > 0 && (
        <div className="overflow-hidden rounded-[24px] glass card-shadow">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Completed
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {done.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <StatusIndicator status="done" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] text-[var(--text-primary)]">{item.label}</div>
                </div>
                {item.platform && (
                  <a
                    href={item.platform.connectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                  >
                    Open →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action modal */}
      {activeItem?.platformId && (
        <ActionModal
          platformId={activeItem.platformId}
          open={activeModal !== null}
          onClose={() => setActiveModal(null)}
          onComplete={() => handleComplete(activeItem)}
        />
      )}

      {/* Custom modal for items without a platformId */}
      {activeItem && !activeItem.platformId && activeModal !== null && (
        <ActionModal
          platform={{
            name: activeItem.label,
            whyItMatters: activeItem.description,
            steps: ["Review your catalog and confirm all collaborator splits are documented", "Generate a split sheet PDF and share with each collaborator", "Mark each collaborator's split as signed once confirmed"],
            confirmPrompt: "All collaborator splits are documented and agreed",
            estimatedMinutes: 10,
            group: "Identity",
          }}
          open={activeModal !== null}
          onClose={() => setActiveModal(null)}
          onComplete={() => setActiveModal(null)}
        />
      )}
    </section>
  );
}
