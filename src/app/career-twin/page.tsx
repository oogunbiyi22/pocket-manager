"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getAuthHeaders } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type TwinArtist = {
  name: string;
  insight: string;
  similarity: number;
};

type TwinAnalysis = {
  twins: TwinArtist[];
  gaps: string[];
  advantages: string[];
  nextMove: string;
  summary: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CareerTwinPage() {
  const { songs, profile } = usePocket();
  const genre = songs[0]?.genre ?? profile.vibe ?? "indie";

  const [analysis, setAnalysis] = useState<TwinAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customGenre, setCustomGenre] = useState(genre);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Try TasteDive for similar artists first
      let tasteDivePeers: string[] = [];
      try {
        const tdRes = await fetch(`/api/tastedive?q=${encodeURIComponent(profile.artistName ?? customGenre)}&type=music&limit=5`);
        if (tdRes.ok) {
          const tdData = await tdRes.json() as { Similar?: { Results?: { Name: string }[] } };
          tasteDivePeers = tdData?.Similar?.Results?.map((r) => r.Name) ?? [];
        }
      } catch { /* silently ignore */ }

      const peersContext = tasteDivePeers.length
        ? `TasteDive found these similar artists: ${tasteDivePeers.join(", ")}. Use them as reference for the twin examples.`
        : "";

      const catalogSummary = songs.map((s) => `"${s.title}" (${s.genre ?? "?"}, ${s.mood ?? "?"}, ISRC: ${s.isrc ?? "needed"})`).join("; ");

      const prompt = `You are a music industry analyst. The artist "${profile.artistName ?? "Artist"}" makes ${customGenre} music. Their catalog: ${catalogSummary || "no releases yet"}. ${peersContext}

Identify 3 real independent artists in the ${customGenre} space who were at a similar stage 2–3 years ago (under 200K monthly listeners, no major label, growing independently). For each, give their name, a similarity score (70–95), and 1 sentence on what specific move broke them through.

Then give:
- 3 specific gaps this artist has vs those peers (direct, not generic)
- 2 advantages they have that peers didn't
- 1 concrete next move (a specific action, not generic advice)
- 1 short 2-sentence summary

Respond ONLY with valid JSON in this exact shape:
{
  "twins": [{"name": "...", "insight": "...", "similarity": 85}],
  "gaps": ["...", "...", "..."],
  "advantages": ["...", "..."],
  "nextMove": "...",
  "summary": "..."
}`;

      const res = await fetch("/api/v1/manager/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          artistName: profile.artistName ?? "Artist",
          songs,
        }),
      });

      if (!res.ok) throw new Error("AI analysis failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response");
      const data = JSON.parse(jsonMatch[0]) as Partial<TwinAnalysis>;

      if (!data.twins?.length) throw new Error("AI returned no twin data");

      setAnalysis({
        twins: (data.twins ?? []).slice(0, 3).map((t) => ({
          name: t.name ?? "",
          insight: t.insight ?? "",
          similarity: t.similarity ?? 80,
        })),
        gaps: data.gaps ?? [],
        advantages: data.advantages ?? [],
        nextMove: data.nextMove ?? "",
        summary: data.summary ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed — try again.");
    } finally {
      setLoading(false);
    }
  }, [customGenre, profile, songs]);

  useEffect(() => {
    void runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title="Career Twin" eyebrow="Intelligence">
      <main className="mx-auto max-w-3xl space-y-4 pb-16 text-white/90">
        {/* Header */}
        <section className="overflow-hidden rounded-[24px] bg-[#0a0a0a] px-6 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Career twin</div>
          <h2 className="mt-3 text-[36px] font-light leading-none tracking-[-0.03em]">
            Who were you before you blew up?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
            Real artists at your exact stage 2–3 years ago — what they did next, and what you&apos;re missing.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <input
              type="text"
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              placeholder="Genre"
              className="h-9 flex-1 max-w-[180px] rounded-lg border-[0.5px] border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 outline-none"
            />
            <button
              type="button"
              onClick={runAnalysis}
              disabled={loading}
              className="rounded-lg btn-electric px-4 py-2 disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Re-analyze"}
            </button>
          </div>
        </section>

        {loading && (
          <div className="rounded-[20px] glass p-8 text-center text-sm text-white/50">
            Running analysis — matching your catalog against real peers…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-[20px] glass p-5">
            <p className="text-sm text-[#e24b4a] mb-3">{error}</p>
            <button onClick={runAnalysis} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
              Try again
            </button>
          </div>
        )}

        {analysis && !loading && (
          <>
            {/* Summary */}
            <section className="rounded-[20px] glass p-5">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">The picture</div>
              <p className="text-[15px] leading-7 text-white/90">{analysis.summary}</p>
            </section>

            {/* Twin artists */}
            <section className="space-y-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Your twins</div>
              {analysis.twins.map((twin, i) => (
                <div key={i} className="overflow-hidden rounded-[20px] glass p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[15px] font-medium text-white/90">{twin.name}</span>
                    <span className="rounded-full bg-[#97c459]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#97c459]">{twin.similarity}% match</span>
                  </div>
                  <p className="text-sm leading-6 text-white/60">
                    <span className="font-medium text-white/90">What broke them through: </span>
                    {twin.insight}
                  </p>
                </div>
              ))}
            </section>

            {/* Gaps */}
            <section className="rounded-[20px] glass p-5">
              <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Gaps vs peers</div>
              <div className="space-y-2">
                {analysis.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border-[0.5px] border-[#e24b4a]/20 bg-[#fef2f2] px-4 py-3 text-sm text-[#f05c5c]">
                    <span className="mt-0.5 shrink-0 text-[#e24b4a]">↓</span>
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Advantages */}
            <section className="rounded-[20px] glass p-5">
              <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Your advantages</div>
              <div className="space-y-2">
                {analysis.advantages.map((adv, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border-[0.5px] border-[#97c459]/30 bg-[#f0f7e6] px-4 py-3 text-sm text-[#97c459]">
                    <span className="mt-0.5 shrink-0 text-[#97c459]">↑</span>
                    <span>{adv}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Next move */}
            <section className="overflow-hidden rounded-[20px] bg-[#0a0a0a] p-5 text-white">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Next move</div>
              <p className="text-[15px] leading-7 text-white">{analysis.nextMove}</p>
              <div className="mt-4 flex gap-3">
                <Link href="/pitching" className="rounded-lg btn-electric px-4 py-2">
                  Open Pitching Engine →
                </Link>
                <Link href="/a" className="rounded-lg border-[0.5px] border-white/20 px-4 py-2 text-sm text-white/70">
                  Ask A
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}
