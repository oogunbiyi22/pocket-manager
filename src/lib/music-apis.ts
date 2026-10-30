/**
 * Client helpers for the music APIs that are actually wired into the app.
 * All calls go through server-side proxies to keep keys safe and enable caching.
 *
 *   MusicBrainz — ISRC + artist metadata (route: /api/musicbrainz)
 *   TheAudioDB  — artist bios/images for the EPK (route: /api/audiodb)
 *   Bandsintown — live events for the EPK (route: /api/bandsintown)
 *
 * Wave 3 removed the helper stubs for proxy routes no UI ever called
 * (iTunes, Deezer, Genius, Last.fm, Lyrics.ovh, Musixmatch, MusicFetch,
 * Genrenator); those routes were deleted with them.
 */

async function get(route: string, params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/${route}?${qs}`);
  if (!res.ok) throw new Error(`${route} error ${res.status}`);
  return res.json();
}

// ─── MusicBrainz ─────────────────────────────────────────────────────────────

/** Look up a recording by ISRC — returns MusicBrainz recording list */
export async function mbLookupIsrc(isrc: string) {
  return get("musicbrainz", { endpoint: "recording", query: `isrc:${isrc}` });
}

/** Search for an artist by name */
export async function mbSearchArtist(name: string) {
  return get("musicbrainz", { endpoint: "artist", query: `artist:${name}` });
}

/** Look up an artist by MusicBrainz ID with relationships */
export async function mbGetArtist(mbid: string) {
  return get("musicbrainz", { endpoint: `artist/${mbid}`, inc: "url-rels" });
}

// ─── TheAudioDB ───────────────────────────────────────────────────────────────

/** Fetch artist info from AudioDB (bio, images, social links) */
export async function audiodbSearchArtist(name: string) {
  return get("audiodb", { endpoint: "searchartists", s: name });
}

/** Fetch discography for an artist */
export async function audiodbGetDiscography(name: string) {
  return get("audiodb", { endpoint: "discography", s: name });
}

/** Search for a track */
export async function audiodbSearchTrack(artistName: string, trackTitle: string) {
  return get("audiodb", { endpoint: "searchtrack", s: artistName, t: trackTitle });
}

// ─── Bandsintown ──────────────────────────────────────────────────────────────

/** Get upcoming events for an artist */
export async function bandsintownGetEvents(artistName: string) {
  return get("bandsintown", { endpoint: `artists/${encodeURIComponent(artistName)}/events` });
}

/** Get artist info from Bandsintown */
export async function bandsintownGetArtist(artistName: string) {
  return get("bandsintown", { endpoint: `artists/${encodeURIComponent(artistName)}` });
}
