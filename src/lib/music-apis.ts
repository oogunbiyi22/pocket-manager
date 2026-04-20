/**
 * Client helpers for all integrated music APIs.
 * All calls go through server-side proxies to keep keys safe and enable caching.
 *
 * Free APIs (no key needed):
 *   MusicBrainz, iTunes Search, TheAudioDB (free tier), Bandsintown, Lyrics.ovh, Genrenator
 *
 * Keyed free APIs (register for free key):
 *   Last.fm (LASTFM_API_KEY), TasteDive (TASTEDIVE_API_KEY),
 *   Genius (GENIUS_ACCESS_TOKEN)
 *
 * Paid APIs:
 *   MusicFetch (MUSICFETCH_TOKEN), Songstats (SONGSTATS_API_KEY),
 *   Musixmatch (MUSIXMATCH_API_KEY), AI Mastering (AIMASTERING_API_KEY)
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

// ─── iTunes Search ────────────────────────────────────────────────────────────

/** Search Apple Music for a track */
export async function itunesSearchTrack(artistName: string, trackTitle: string) {
  return get("itunes", { term: `${artistName} ${trackTitle}`, entity: "musicTrack", limit: "5" });
}

/** Search Apple Music for an artist */
export async function itunesSearchArtist(name: string) {
  return get("itunes", { term: name, entity: "musicArtist", limit: "5" });
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

// ─── Lyrics.ovh ───────────────────────────────────────────────────────────────

/** Fetch lyrics for a song */
export async function getLyrics(artistName: string, trackTitle: string) {
  return get("lyrics", { artist: artistName, title: trackTitle });
}

// ─── Last.fm ─────────────────────────────────────────────────────────────────

/** Get similar artists to a given artist */
export async function lastfmGetSimilarArtists(artistName: string, limit = 10) {
  return get("lastfm", { method: "artist.getSimilar", artist: artistName, limit: String(limit) });
}

/** Get artist info including bio and listener count */
export async function lastfmGetArtistInfo(artistName: string) {
  return get("lastfm", { method: "artist.getInfo", artist: artistName });
}

/** Get top tracks for an artist */
export async function lastfmGetTopTracks(artistName: string, limit = 10) {
  return get("lastfm", { method: "artist.getTopTracks", artist: artistName, limit: String(limit) });
}

// ─── TasteDive ────────────────────────────────────────────────────────────────

/** Get similar artists (powers Career Twin) */
export async function tastediveGetSimilar(artistName: string, limit = 10) {
  return get("tastedive", { q: artistName, type: "music", limit: String(limit) });
}

// ─── Genius ───────────────────────────────────────────────────────────────────

/** Search Genius for lyrics and annotations */
export async function geniusSearch(query: string) {
  return get("genius", { endpoint: "search", q: query });
}

// ─── MusicFetch ───────────────────────────────────────────────────────────────

/** Resolve a track across all DSPs by ISRC */
export async function musicfetchByIsrc(isrc: string) {
  return get("musicfetch", { isrc });
}

/** Resolve a track across all DSPs by UPC (album barcode) */
export async function musicfetchByUpc(upc: string) {
  return get("musicfetch", { upc });
}

/** Resolve a track/album/artist by Spotify URL */
export async function musicfetchByUrl(spotifyUrl: string) {
  return get("musicfetch", { url: spotifyUrl });
}

// ─── Musixmatch ───────────────────────────────────────────────────────────────

/** Search for a track */
export async function musixmatchSearchTrack(trackTitle: string, artistName: string) {
  return get("musixmatch", { method: "track.search", q_track: trackTitle, q_artist: artistName });
}

/** Get lyrics by ISRC */
export async function musixmatchGetLyrics(isrc: string) {
  return get("musixmatch", { method: "track.lyrics.get", track_isrc: isrc });
}

// ─── Genrenator ───────────────────────────────────────────────────────────────

/** Generate random creative genre combinations */
export async function generateGenre(count = 1) {
  return get("genrenator", { count: String(count) });
}
