"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatMoney } from "@/lib/backstage-data";
import { getSupabase } from "@/lib/supabase";

type BeatLicense = {
  id: string;
  songId: string;
  buyer: string;
  type: "lease" | "exclusive";
  amount: number;
  date: string;
  expires: string;
};

export default function BeatsPage() {
  const { songs, signedIn } = usePocket();
  const [licenses, setLicenses] = useState<BeatLicense[]>([]);

  // Load persisted licenses. If the API isn't reachable or the beat_licenses
  // table doesn't exist yet (PATCH 004 not run), the page quietly keeps its
  // original in-memory behavior.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    async function load() {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const res = await fetch("/api/v1/beats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.persisted && Array.isArray(data.licenses)) {
          setLicenses(data.licenses as BeatLicense[]);
        }
      } catch {
        // Offline or pre-migration — in-memory mode.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);
  const [form, setForm] = useState({
    songId: songs[0]?.id ?? "",
    buyer: "",
    type: "lease" as BeatLicense["type"],
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    expires: "",
  });
  const selectedSong = songs.find((song) => song.id === form.songId) ?? songs[0];
  const totalRevenue = licenses.reduce((total, license) => total + license.amount, 0);
  const conflicts = useMemo(() => getLicenseConflicts(licenses), [licenses]);
  const agreementPreview = selectedSong
    ? [
        "Pocket Manager beat license preview",
        `Beat/song: ${selectedSong.title}`,
        `Buyer: ${form.buyer || "Buyer name needed"}`,
        `License type: ${form.type}`,
        `Amount: ${formatMoney(Number(form.amount) || 0)}`,
        `Date: ${form.date}`,
        `Expires: ${form.expires || "No expiry set"}`,
        "",
        "This is not a legal document. Consult an attorney before use in a real deal.",
      ].join("\n")
    : "Add a song before creating a beat license.";

  async function addLicense() {
    if (!form.songId || !form.buyer.trim()) {
      return;
    }

    const license: BeatLicense = {
      id: `${form.songId}-${Date.now()}`,
      songId: form.songId,
      buyer: form.buyer.trim(),
      type: form.type,
      amount: Number(form.amount) || 0,
      date: form.date,
      expires: form.expires,
    };
    setLicenses((current) => [license, ...current]);
    setForm((current) => ({ ...current, buyer: "", amount: "", expires: "" }));

    // Persist in the background; the local copy above stays either way, so
    // the page behaves exactly as before until the table exists.
    if (!signedIn) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      const res = await fetch("/api/v1/beats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          songId: license.songId,
          buyer: license.buyer,
          type: license.type,
          amount: license.amount,
          date: license.date,
          expires: license.expires,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.license?.id) {
          setLicenses((current) =>
            current.map((item) => (item.id === license.id ? { ...item, id: data.license.id as string } : item)),
          );
        }
      }
    } catch {
      // Keep the local copy — same behavior as before persistence.
    }
  }

  return (
    <AppShell title="Beat Licensing" eyebrow="Producer tool">
      <main className="mx-auto max-w-5xl rounded-[24px] border-[0.5px] border-white/[0.08] bg-[#141412] p-5 text-white/90">
        <section className="rounded-xl border-[0.5px] border-white/[0.08] bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Beat licensing manager</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Track who licensed a beat and where conflicts start.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Log leases and exclusives, spot conflicts before they happen, and generate a plain-language agreement preview.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Log license</div>
              <label className="mt-4 block text-sm text-white/60">
                <span className="mb-2 block">Beat / song</span>
                <select
                  value={form.songId}
                  onChange={(event) => setForm((current) => ({ ...current, songId: event.target.value }))}
                  className="h-12 w-full rounded-lg border-[0.5px] border-white/[0.08] bg-white/[0.08] px-3 text-sm text-white/90 outline-none"
                >
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>{song.title}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm text-white/60">
                <span className="mb-2 block">Buyer</span>
                <input
                  value={form.buyer}
                  onChange={(event) => setForm((current) => ({ ...current, buyer: event.target.value }))}
                  className="h-12 w-full rounded-lg border-[0.5px] border-white/[0.08] bg-white/[0.08] px-3 text-sm text-white/90 outline-none"
                />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/60">
                  <span className="mb-2 block">Type</span>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as BeatLicense["type"] }))}
                    className="h-12 w-full rounded-lg border-[0.5px] border-white/[0.08] bg-white/[0.08] px-3 text-sm text-white/90 outline-none"
                  >
                    <option value="lease">Lease</option>
                    <option value="exclusive">Exclusive</option>
                  </select>
                </label>
                <label className="block text-sm text-white/60">
                  <span className="mb-2 block">Amount</span>
                  <input
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    inputMode="decimal"
                    className="h-12 w-full rounded-lg border-[0.5px] border-white/[0.08] bg-white/[0.08] px-3 text-sm text-white/90 outline-none"
                  />
                </label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/60">
                  <span className="mb-2 block">Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    className="h-12 w-full rounded-lg border-[0.5px] border-white/[0.08] bg-white/[0.08] px-3 text-sm text-white/90 outline-none"
                  />
                </label>
                <label className="block text-sm text-white/60">
                  <span className="mb-2 block">Expiry</span>
                  <input
                    type="date"
                    value={form.expires}
                    onChange={(event) => setForm((current) => ({ ...current, expires: event.target.value }))}
                    className="h-12 w-full rounded-lg border-[0.5px] border-white/[0.08] bg-white/[0.08] px-3 text-sm text-white/90 outline-none"
                  />
                </label>
              </div>
              <button type="button" onClick={addLicense} className="mt-4 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Log license
              </button>
            </div>

            <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Agreement preview</div>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.05] p-3 text-xs leading-5 text-white/60">{agreementPreview}</pre>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Licenses" value={`${licenses.length}`} />
              <Metric label="Revenue" value={formatMoney(totalRevenue)} />
              <Metric label="Conflicts" value={`${conflicts.length}`} />
            </div>

            <section className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Logged licenses</div>
              <div className="mt-3 space-y-2">
                {licenses.length ? (
                  licenses.map((license) => {
                    const song = songs.find((item) => item.id === license.songId);

                    return (
                      <div key={license.id} className="rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.05] px-3 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-white/90">{song?.title ?? "Unknown beat"}</div>
                            <div className="mt-1 text-xs text-white/50">{license.buyer} · {license.type} · {license.date}</div>
                          </div>
                          <div className="text-white/90">{formatMoney(license.amount)}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border-[0.5px] border-dashed border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/50">
                    No licenses logged yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Flags</div>
              <div className="mt-3 space-y-2 text-sm text-white/60">
                {conflicts.length ? conflicts.map((item) => <div key={item}>{item}</div>) : <div>No exclusive/lease conflicts from the logged licenses.</div>}
              </div>
              <Link href="/projects" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Open catalog
              </Link>
            </section>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function getLicenseConflicts(licenses: BeatLicense[]) {
  const conflicts: string[] = [];
  const bySong = licenses.reduce<Record<string, BeatLicense[]>>((groups, license) => {
    groups[license.songId] = [...(groups[license.songId] ?? []), license];
    return groups;
  }, {});

  Object.values(bySong).forEach((songLicenses) => {
    if (songLicenses.some((license) => license.type === "exclusive") && songLicenses.some((license) => license.type === "lease")) {
      conflicts.push("Exclusive license exists alongside lease history. Review buyer obligations before selling new rights.");
    }
  });

  return conflicts;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">{label}</div>
      <div className="mt-2 text-xl font-normal text-white/90">{value}</div>
    </div>
  );
}
