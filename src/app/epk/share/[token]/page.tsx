/**
 * Public EPK — /epk/share/[token]
 *
 * Read-only press kit for whoever holds the artist's share link. The token
 * (profiles.epk_share_token, PATCH 005) is the only credential: this route
 * sits outside the proxy auth guard on purpose, resolves the token with the
 * service role, and renders the artist's real catalog data — no session, no
 * login wall. Regenerating or revoking the token in the EPK builder kills
 * the old link immediately (force-dynamic: nothing here is cached).
 *
 * Stats are the artist's real numbers only — the same helpers the builder
 * uses. Nothing on this page is estimated or extrapolated.
 */

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  DEMO_SONG_IDS,
  formatMoney,
  getCatalogReadinessScore,
  getSongConfirmedIncome,
  getSongReadinessScore,
  type SongCatalogItem,
} from "@/lib/backstage-data";

export const dynamic = "force-dynamic";

type SharedProfile = {
  id: string;
  artist_name: string | null;
  role: string | null;
  epk_bio: string | null;
  epk_contact: string | null;
};

/** Fill the fields the stat helpers rely on; stored catalog JSON is trusted but loosely shaped. */
function normalizeSong(raw: Partial<SongCatalogItem>): SongCatalogItem {
  const streams = Array.isArray(raw.revenueStreams) ? raw.revenueStreams : [];
  return {
    id: raw.id ?? "",
    title: raw.title ?? "Untitled",
    isrc: raw.isrc ?? "",
    upc: raw.upc,
    releaseDate: raw.releaseDate ?? "",
    genre: raw.genre,
    mood: raw.mood,
    bpm: raw.bpm,
    musicalKey: raw.musicalKey,
    language: raw.language,
    streams: typeof raw.streams === "number" ? raw.streams : 0,
    territory: raw.territory ?? "",
    emotionalStory: raw.emotionalStory,
    spotifyArtistId: raw.spotifyArtistId,
    spotifyTrackId: raw.spotifyTrackId,
    collaborators: Array.isArray(raw.collaborators) ? raw.collaborators : [],
    distributionPlatforms: Array.isArray(raw.distributionPlatforms) ? raw.distributionPlatforms : [],
    metadataComplete: Boolean(raw.metadataComplete),
    artworkUploaded: Boolean(raw.artworkUploaded),
    splitSheetSigned: Boolean(raw.splitSheetSigned),
    revenueStreams: streams.map((stream) => ({
      ...stream,
      actualAmount: typeof stream.actualAmount === "number" ? stream.actualAmount : 0,
      estimatedGap: typeof stream.estimatedGap === "number" ? stream.estimatedGap : 0,
    })),
    assets: Array.isArray(raw.assets) ? raw.assets : [],
  };
}

async function loadSharedEpk(token: string): Promise<{ profile: SharedProfile; songs: SongCatalogItem[] } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, artist_name, role, epk_bio, epk_contact")
    .eq("epk_share_token", token)
    .maybeSingle();

  if (error || !profile) return null;

  const { data: catalog } = await admin
    .from("user_catalogs")
    .select("songs")
    .eq("user_id", (profile as SharedProfile).id)
    .maybeSingle();

  const rawSongs = (catalog as { songs?: Partial<SongCatalogItem>[] } | null)?.songs;
  const songs = (Array.isArray(rawSongs) ? rawSongs : [])
    .filter((song) => song.id && !DEMO_SONG_IDS.has(song.id))
    .map(normalizeSong);

  return { profile: profile as SharedProfile, songs };
}

function formatStreams(total: number): string {
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000) return `${Math.round(total / 1_000)}K`;
  return String(total);
}

export default async function SharedEpkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await loadSharedEpk(token);
  if (!shared) notFound();

  const { profile, songs } = shared;
  const artistName = profile.artist_name || "Artist";
  const totalStreams = songs.reduce((t, s) => t + s.streams, 0);
  const totalIncome = songs.reduce((t, s) => t + getSongConfirmedIncome(s), 0);
  const readiness = getCatalogReadinessScore(songs);

  return (
    <div className="min-h-screen bg-[#0d0d0b] text-white">
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Electronic press kit
        </div>
        <h1 className="mt-4 text-[44px] font-light leading-none tracking-[-0.03em]">{artistName}</h1>
        {profile.role && <p className="mt-2 text-sm text-white/50">{profile.role}</p>}

        {profile.epk_bio ? (
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/70">{profile.epk_bio}</p>
        ) : null}
        {profile.epk_contact ? (
          <p className="mt-3 text-sm text-white/50">{profile.epk_contact}</p>
        ) : null}

        {songs.length === 0 ? (
          <section className="mt-10 rounded-[20px] border-[0.5px] border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
            <div className="text-[15px] font-medium text-white/90">No releases published yet</div>
            <p className="mt-1 text-sm text-white/50">This artist hasn&apos;t added a catalog to their EPK yet.</p>
          </section>
        ) : (
          <>
            <section className="mt-10 grid grid-cols-2 overflow-hidden rounded-[20px] border-[0.5px] border-white/10 sm:grid-cols-4">
              <ShareStat label="Streams" value={formatStreams(totalStreams)} />
              <ShareStat label="Releases" value={String(songs.length)} />
              <ShareStat label="Confirmed income" value={formatMoney(totalIncome)} />
              <ShareStat label="Catalog readiness" value={`${readiness}/100`} />
            </section>

            <section className="mt-10">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Catalog</div>
              <div className="mt-4 space-y-3">
                {songs.map((song) => (
                  <article key={song.id} className="rounded-[20px] border-[0.5px] border-white/10 bg-[#141412] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-normal text-white/90">{song.title}</h2>
                        <div className="mt-1 text-xs text-white/50">
                          {[song.releaseDate, song.genre, song.mood].filter(Boolean).join(" · ") || "Release details coming soon"}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#97c459]/10 px-3 py-1 text-[11px] font-medium text-[#97c459]">
                        {getSongReadinessScore(song)}/100 ready
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/60">
                      Confirmed income: {formatMoney(getSongConfirmedIncome(song))}. Readiness and registration proof are ready before the pitch goes out.
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="mt-12 border-t-[0.5px] border-white/8 pt-4 text-center text-[11px] text-white/35">
          Shared with Pocket Manager
        </footer>
      </main>
    </div>
  );
}

function ShareStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-white/8 bg-[#141412] p-4 text-center [&:not(:last-child)]:border-r-[0.5px]">
      <div className="text-lg font-medium text-white/90">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/50">{label}</div>
    </div>
  );
}
