"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
const ActionModal = dynamic(() => import("@/components/action-modal").then(m => ({ default: m.ActionModal })), { ssr: false });
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";
import { PLATFORM_REGISTRY, type PlatformEntry } from "@/lib/platform-registry";

// Merge registry metadata with user's platform connections
function usePlatformData() {
  const { platformConnections, updatePlatformConnection } = usePocket();

  const platforms = PLATFORM_REGISTRY.map((reg) => {
    const conn = platformConnections.find((c) => c.id === reg.id);
    return {
      ...reg,
      status: conn?.status ?? ("not_connected" as const),
      missingStep: conn?.missingStep,
    };
  });

  return { platforms, updatePlatformConnection };
}

const GROUPS: PlatformEntry["group"][] = [
  "Distributor",
  "PRO",
  "Digital Performance",
  "Publishing",
  "Analytics",
  "Content ID",
  "Identity",
];

type PlatformWithStatus = PlatformEntry & {
  status: "connected" | "not_connected" | "incomplete" | "connecting" | "error" | "reconnect_required";
  missingStep?: string;
};

function StatusBadge({ status }: { status: PlatformWithStatus["status"] }) {
  const map: Record<PlatformWithStatus["status"], { label: string; className: string }> = {
    connected: { label: "Connected", className: "bg-[#5fcf7e]/10 text-[#5fcf7e]" },
    not_connected: { label: "Not connected", className: "bg-[rgba(0,0,0,0.06)] text-white/50" },
    incomplete: { label: "Incomplete", className: "bg-[#faeeda] text-[#f0a832]" },
    connecting: { label: "Connecting…", className: "bg-[#faeeda] text-[#f0a832]" },
    error: { label: "Error", className: "bg-[#f05c5c]/10 text-[#f05c5c]" },
    reconnect_required: { label: "Reconnect", className: "bg-[#f05c5c]/10 text-[#f05c5c]" },
  };
  const { label, className } = map[status] ?? map.not_connected;
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function PlatformsPage() {
  const { songs } = usePocket();
  const { platforms, updatePlatformConnection } = usePlatformData();
  const summary = getRevenueGapSummary(songs);

  const [modalPlatformId, setModalPlatformId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const connectedCount = platforms.filter((p) => p.status === "connected").length;
  const totalCount = platforms.length;
  const connectionPct = Math.round((connectedCount / totalCount) * 100);

  function handleComplete(platformId: string) {
    updatePlatformConnection(platformId, "connected");
  }

  return (
    <AppShell title="Platforms" eyebrow="Connection status">
      <main className="mx-auto max-w-3xl space-y-4 text-[var(--text-primary)]">

        {/* Hero command surface */}
        <section className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-6 text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Platform connections
          </div>
          <div className="mt-3 text-[44px] font-light leading-none tracking-[-0.04em]">
            {connectedCount}{" "}
            <span className="text-[28px] text-white/35">of {totalCount}</span>
          </div>
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#97c459] transition-all duration-700"
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
          <p className="mt-4 text-sm leading-7 text-white/45">
            Each platform controls a different royalty door. Connecting all of them is how you close The Gap.
          </p>
        </section>

        {/* Platform groups */}
        {GROUPS.map((group) => {
          const groupPlatforms = platforms.filter((p) => p.group === group);
          if (!groupPlatforms.length) return null;

          return (
            <section key={group} className="overflow-hidden rounded-[24px] glass card-shadow">
              <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {group}
                </div>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {groupPlatforms.map((platform) => {
                  const isExpanded = expanded === platform.id;
                  const isConnected = platform.status === "connected";

                  return (
                    <div key={platform.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : platform.id)}
                            className="flex items-center gap-2 text-left"
                          >
                            <span className="text-base">{platform.icon}</span>
                            <div className="text-[15px] font-medium text-[var(--text-primary)]">
                              {platform.name}
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </button>
                          <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {platform.moneyType}
                          </div>
                        </div>
                        <StatusBadge status={platform.status} />
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          <div className="rounded-[12px] glass-subtle px-4 py-3 text-[13px] leading-6 text-[var(--text-muted)]">
                            <strong className="text-[var(--text-primary)]">Why it matters:</strong>{" "}
                            {platform.whyItMatters}
                          </div>
                          {!isConnected && (
                            <div className="rounded-[12px] bg-[#faeeda] px-4 py-3 text-[13px] leading-6 text-[#f0a832]">
                              <strong>Steps:</strong>
                              <ol className="mt-1 space-y-1">
                                {platform.steps.slice(0, 3).map((step, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="shrink-0 font-semibold">{i + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                              <div className="mt-2 text-[11px] opacity-70">~{platform.estimatedMinutes} min</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action row */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {isConnected ? (
                          <>
                            <span className="flex-1 text-xs text-[var(--text-muted)]">
                              {platform.payoutUrl ? "Check payout settings →" : "Connected"}
                            </span>
                            {platform.payoutUrl && (
                              <a
                                href={platform.payoutUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl glass-subtle px-3 py-1.5 text-xs text-[var(--text-muted)] press"
                              >
                                Payout settings →
                              </a>
                            )}
                            <a
                              href={platform.connectUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl glass-subtle px-3 py-1.5 text-xs text-[var(--text-muted)] press"
                            >
                              Open →
                            </a>
                            <button
                              type="button"
                              onClick={() => updatePlatformConnection(platform.id, "not_connected")}
                              className="rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] press"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <>
                            {platform.status === "incomplete" && platform.missingStep && (
                              <span className="flex-1 text-xs text-[var(--text-muted)]">
                                {platform.missingStep}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setModalPlatformId(platform.id)}
                              className="rounded-xl bg-[var(--bg-dark)] px-4 py-2 text-xs font-semibold text-white press"
                            >
                              {platform.status === "incomplete" ? "Finish setup →" : "Set up →"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Info card */}
        <section className="rounded-[24px] glass-subtle px-5 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Why so many platforms?
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Music royalties are split across 5+ separate systems that don&apos;t talk to each other.
            Your distributor pays streaming income. Your PRO collects performance royalties.
            SoundExchange handles digital radio. The MLC handles US mechanicals.
            Each one is a separate door — and each unopened door is uncollected money.
          </p>
        </section>
      </main>

      {/* Action modal — opens with guided flow + steps */}
      <ActionModal
        platformId={modalPlatformId ?? undefined}
        open={modalPlatformId !== null}
        onClose={() => setModalPlatformId(null)}
        onComplete={() => {
          if (modalPlatformId) handleComplete(modalPlatformId);
        }}
      />
    </AppShell>
  );
}
