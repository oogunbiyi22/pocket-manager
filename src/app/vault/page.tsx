"use client";

import Link from "next/link";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getAssetActionLinks, getProjectMemory } from "@/lib/backstage-data";

export default function VaultPage() {
  const { projects } = usePocket();
  const allAssets = projects.flatMap((project) =>
    getAssetActionLinks(project).map((item) => ({ ...item, projectId: project.id })),
  );
  const rawAssets = projects.flatMap((project) =>
    project.assets.map((asset) => ({
      projectId: project.id,
      projectName: project.name,
      name: asset.name,
      type: asset.type,
      status: asset.status,
    })),
  );
  const projectMemories = projects.flatMap((project) =>
    getProjectMemory(project).map((memory) => ({ projectId: project.id, projectName: project.name, memory })),
  );
  const vaultSummary = {
    totalAssets: rawAssets.length,
    uploadedAssets: rawAssets.filter((asset) => asset.status === "Uploaded" || asset.status === "Captured").length,
    readyAssets: rawAssets.filter((asset) => asset.status === "Ready").length,
    projectsWithAssets: new Set(rawAssets.map((asset) => asset.projectId)).size,
  };

  return (
    <AppShell title="Vault" eyebrow="Assets and memory">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Asset continuity"
          description="The vault should be a real cross-project surface for files, usage context, and what still needs a home."
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
            <VaultStat label="Total assets" value={`${vaultSummary.totalAssets}`} />
            <VaultStat label="New uploads" value={`${vaultSummary.uploadedAssets}`} />
            <VaultStat label="Ready" value={`${vaultSummary.readyAssets}`} />
            <VaultStat label="Active rooms" value={`${vaultSummary.projectsWithAssets}`} />
          </div>
          <div className="space-y-3 text-sm text-white/70">
            {allAssets.length ? (
              allAssets.map((item) => (
                <Link
                  key={`${item.projectId}-${item.asset}`}
                  href={`/projects/${item.projectId}`}
                  className="block rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{item.asset}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{item.project}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.status}
                    </div>
                  </div>
                  <div className="mt-3 text-white/65">
                    <span className="text-white">Tied to:</span> {item.tiedTo}
                  </div>
                  <div className="mt-2 leading-6 text-white/60">{item.usage}</div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-white/45">
                No assets logged yet.
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Raw vault inventory" description="The actual asset records saved inside project rooms.">
            <div className="space-y-3 text-sm text-white/70">
              {rawAssets.length ? (
                rawAssets.map((asset) => (
                  <Link
                    key={`${asset.projectId}-${asset.name}`}
                    href={`/projects/${asset.projectId}`}
                    className="block rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{asset.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                          {asset.projectName} · {asset.type}
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                        {asset.status}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-white/45">
                  No raw asset records saved yet.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Project memory" description="Pocket should preserve patterns that help across releases, not only store files.">
            <div className="space-y-3 text-sm text-white/70">
              {projectMemories.map((item, index) => (
                <Link
                  key={`${item.projectId}-${index}`}
                  href={`/projects/${item.projectId}`}
                  className="block rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4 transition hover:border-emerald-300/30"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">{item.projectName}</div>
                  <div className="mt-2 leading-6 text-white/75">{item.memory}</div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="What the vault should become" description="A more credible storage surface than a generic projects list.">
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "Search assets by project, type, and rollout usage.",
                "Show what files are final versus soft or missing.",
                "Preserve campaign memory alongside the files themselves.",
                "Let mobile capture land directly into the right room vault.",
              ].map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function VaultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/65">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
