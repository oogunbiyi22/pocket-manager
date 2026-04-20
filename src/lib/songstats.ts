/**
 * Songstats + Radiostats client helpers.
 *
 * Call these from client components — they hit our own proxy routes which
 * keep the API key server-side and cache responses for 24h.
 *
 * Both functions require the Supabase session token so the proxy can verify
 * the user is signed in before forwarding the request upstream.
 */

export type SongstatsTrackInfo = {
  isrc: string;
  title: string;
  artists: string[];
  releaseDate: string;
  duration: number;
  coverUrl: string | null;
  links: Record<string, string>; // platform → URL
};

export type SongstatsTrackStats = {
  source: string;
  streams: number;
  streamsDelta7d: number;
  playlists: number;
  popularity: number;
  updatedAt: string;
};

export type SongstatsArtistStats = {
  source: string;
  followers: number;
  monthlyListeners: number;
  popularity: number;
  updatedAt: string;
};

export type RadiostatsTrackStats = {
  totalPlays: number;
  totalStations: number;
  audienceReach: number;
  topCountry: string | null;
  updatedAt: string;
};

async function proxyGet(
  route: "songstats" | "radiostats",
  endpoint: string,
  params: Record<string, string>,
  token: string,
): Promise<unknown> {
  const qs = new URLSearchParams({ endpoint, ...params }).toString();
  const res = await fetch(`/api/${route}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `${route} error ${res.status}`);
  }
  return res.json();
}

/** Fetch track metadata from Songstats by ISRC */
export async function getSongstatsTrackInfo(isrc: string, token: string): Promise<unknown> {
  return proxyGet("songstats", "tracks/info", { isrc }, token);
}

/** Fetch current streaming stats for a track (all DSPs) */
export async function getSongstatsTrackStats(isrc: string, token: string): Promise<unknown> {
  return proxyGet("songstats", "tracks/stats", { isrc }, token);
}

/** Fetch playlists a track appears on */
export async function getSongstatsTrackPlaylists(isrc: string, token: string): Promise<unknown> {
  return proxyGet("songstats", "tracks/playlists", { isrc }, token);
}

/** Fetch artist-level stats (monthly listeners, followers) */
export async function getSongstatsArtistStats(
  spotifyArtistId: string,
  token: string,
): Promise<unknown> {
  return proxyGet("songstats", "artists/stats", { spotify_artist_id: spotifyArtistId }, token);
}

/** Fetch artist catalog (all tracks with stats) */
export async function getSongstatsArtistCatalog(
  spotifyArtistId: string,
  token: string,
): Promise<unknown> {
  return proxyGet("songstats", "artists/catalog", { spotify_artist_id: spotifyArtistId }, token);
}

/** Fetch playlist placements + editorial activity events for a track */
export async function getSongstatsTrackActivities(isrc: string, token: string): Promise<unknown> {
  return proxyGet("songstats", "tracks/activities", { isrc }, token);
}

/** Fetch country/city breakdown of where a track is streaming */
export async function getSongstatsTrackLocations(isrc: string, token: string): Promise<unknown> {
  return proxyGet("songstats", "tracks/locations", { isrc }, token);
}

/** Fetch the top playlists an artist appears on across all DSPs */
export async function getSongstatsArtistTopPlaylists(
  spotifyArtistId: string,
  token: string,
): Promise<unknown> {
  return proxyGet("songstats", "artists/top_playlists", { spotify_artist_id: spotifyArtistId }, token);
}

/** Fetch radio airplay stats for a track by ISRC */
export async function getRadiostatsTrackStats(isrc: string, token: string): Promise<unknown> {
  return proxyGet("radiostats", "tracks/stats", { isrc }, token);
}

/** Fetch radio airplay stats for an artist */
export async function getRadiostatsArtistStats(
  spotifyArtistId: string,
  token: string,
): Promise<unknown> {
  return proxyGet("radiostats", "artists/stats", { spotify_artist_id: spotifyArtistId }, token);
}
