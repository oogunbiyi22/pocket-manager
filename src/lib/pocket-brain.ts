// Pocket Brain — self-contained intelligence, no external AI keys required.

import {
  getRevenueGapSummary,
  getRevenueActionQueue,
  getCatalogReadinessScore,
  getReadinessLevel,
  getSongReadinessScore,
  getSongEstimatedGap,
  formatGapEstimate,
  formatMoney,
  type SongCatalogItem,
  type PlatformConnection,
} from "./backstage-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatInput {
  lastMessage: string;
  songs: SongCatalogItem[];
  platforms: PlatformConnection[];
  artistName: string;
  managerName: string;
  page?: string;
}

export interface PitchInput {
  artistName: string;
  artistContact?: string;
  emotionalStory?: string;
  song: {
    title: string;
    genre?: string;
    mood?: string;
    bpm?: number;
    musicalKey?: string;
    releaseDate?: string;
    isrc?: string;
  };
  curator: {
    name: string;
    playlistName: string;
    playlistType?: string;
    genre?: string;
    followers?: string;
    platform?: string;
    notes?: string;
  };
}

export interface ContractFlag {
  label: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  excerpt: string;
  plainEnglish: string;
  attorneyQuestion: string;
}

export interface ContractAnalysis {
  summary: string;
  overallRisk: "Low" | "Medium" | "High" | "Critical";
  flags: ContractFlag[];
  positives: string[];
  nextSteps: string[];
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

type Intent =
  | "gap"
  | "readiness"
  | "royalties"
  | "soundexchange"
  | "mlc"
  | "pro"
  | "isrc"
  | "publishing"
  | "contracts"
  | "spotify"
  | "apple"
  | "tidal"
  | "dsps"
  | "marketing"
  | "playlist"
  | "tiktok"
  | "sync"
  | "live"
  | "finance"
  | "greeting"
  | "fallback";

function detectIntent(text: string, page?: string): Intent {
  const t = text.toLowerCase();

  // Greeting / capability check
  if (/^(hi|hello|hey|sup|what can you|what do you|who are you|what are you)\b/.test(t)) return "greeting";

  // Gap / next action
  if (/gap|what.*next|next step|priority|what should i|what do i|action|todo|to.do/.test(t)) return "gap";

  // Readiness / score
  if (/readiness|ready|score|how.*ready|complete|missing|what.*missing/.test(t)) return "readiness";

  // Specific royalty bodies
  if (/soundexchange|sound exchange|digital radio|pandora|sirius/.test(t)) return "soundexchange";
  if (/\bmlc\b|mechanical.*collective|mechanical.*licens|the mlc/.test(t)) return "mlc";
  if (/\bpro\b|ascap|bmi|sesac|performance royalt/.test(t)) return "pro";
  if (/\bisrc\b/.test(t)) return "isrc";
  if (/publishing|publisher|mechanical|songtrust|composition royalt/.test(t)) return "publishing";

  // Contracts
  if (/contract|deal|clause|sign|agreement|label deal|360|recoup|advance|perpetuity/.test(t) || page === "contracts") return "contracts";

  // DSPs
  if (/\bspotify\b|discover weekly|release radar|spotify.*algorithm/.test(t)) return "spotify";
  if (/apple music|itunes|spatial audio|atmos/.test(t)) return "apple";
  if (/\btidal\b/.test(t)) return "tidal";
  if (/youtube|soundcloud|bandcamp|amazon music|deezer/.test(t)) return "dsps";

  // Marketing
  if (/tiktok|reels|shorts|viral|trending|short.form/.test(t)) return "tiktok";
  if (/playlist|curator|editorial|pitch.*playlist|submit.*hub|groover/.test(t)) return "playlist";
  if (/market|release.*plan|rollout|campaign|pre.save|pre.release/.test(t) || page === "signal") return "marketing";

  // Sync
  if (/sync|licens|tv|film|ad|commercial|placement|supervisor/.test(t)) return "sync";

  // Live
  if (/tour|show|gig|book|venue|festival|live|perform/.test(t)) return "live";

  // Finance
  if (/money|income|revenue|earning|stream.*pay|per.*stream|royalt|how much/.test(t) || page === "financial" || page === "forecast") return "finance";

  // Royalties (general)
  if (/royalt|collect|register|uncollect|right/.test(t)) return "royalties";

  // Page context hints
  if (page === "harvest") return "gap";
  if (page === "platforms") return "dsps";

  return "fallback";
}

// ─── Artist Context Builders ──────────────────────────────────────────────────

function buildConnectedPlatformNote(platforms: PlatformConnection[]): string {
  const connected = platforms.filter(p => p.status === "connected").map(p => p.name);
  const missing = platforms.filter(p => p.status !== "connected").slice(0, 3).map(p => p.name);
  if (!connected.length && !missing.length) return "";
  const parts: string[] = [];
  if (connected.length) parts.push(`connected to ${connected.join(", ")}`);
  if (missing.length) parts.push(`missing ${missing.join(", ")}`);
  return parts.join(" — ");
}

function topGapLine(songs: SongCatalogItem[]): string {
  const queue = getRevenueActionQueue(songs).slice(0, 1);
  if (!queue.length) return "";
  const a = queue[0];
  return `"${a.songTitle}" has the biggest open gap — ${formatGapEstimate(a.estimatedValue)} uncollected via ${a.collectionBody}.`;
}

// ─── Response Templates ───────────────────────────────────────────────────────

function respondGap(songs: SongCatalogItem[], platforms: PlatformConnection[], name: string): string {
  if (!songs.length) {
    return `${name}, add your first song in Work → New Song so I can pull your actual gaps and priority actions. Once it's in, I'll tell you exactly what's uncollected and what to do first.`;
  }
  const summary = getRevenueGapSummary(songs);
  const queue = getRevenueActionQueue(songs).slice(0, 3);
  const score = getCatalogReadinessScore(songs);
  const level = getReadinessLevel(score);

  const actions = queue.map((a, i) =>
    `${i + 1}. ${a.action} via ${a.collectionBody} for "${a.songTitle}" — ${formatGapEstimate(a.estimatedValue)} — ${a.estimatedTime}`
  ).join("\n");

  return `${name}, your catalog has ${formatGapEstimate(summary.totalEstimatedGap)} in uncollected royalties across ${summary.songsWithGaps} song${summary.songsWithGaps !== 1 ? "s" : ""}. Top moves right now:\n\n${actions}\n\nCatalog readiness: ${score}% (${level}). ${summary.totalSecured > 0 ? `Confirmed income this quarter: ${formatMoney(summary.totalSecured)}.` : "Start collecting and that confirmed number starts climbing."}`;
}

function respondReadiness(songs: SongCatalogItem[], name: string): string {
  if (!songs.length) {
    return `${name}, add songs to your catalog first — then I can score each one and tell you exactly what's missing per track. Go to Work → New Song to start.`;
  }
  const score = getCatalogReadinessScore(songs);
  const level = getReadinessLevel(score);
  const weak = songs
    .map(s => ({ s, r: getSongReadinessScore(s) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 2);

  const weakLines = weak.map(({ s, r }) => {
    const gap = getSongEstimatedGap(s);
    return `"${s.title}" — ${r}/100 readiness, ${formatGapEstimate(gap)} gap`;
  }).join("; ");

  return `${name}, catalog readiness is ${score}% (${level}) across ${songs.length} song${songs.length !== 1 ? "s" : ""}. Weakest links: ${weakLines}. Fix ISRC codes and register with The MLC and SoundExchange first — those two alone recover most gaps for independent artists.`;
}

function respondRoyalties(platforms: PlatformConnection[], name: string): string {
  const platformNote = buildConnectedPlatformNote(platforms);
  return `${name}, four royalty streams most independent artists leave uncollected:\n\n1. SoundExchange — US digital radio (Pandora, SiriusXM, iHeart). Register at soundexchange.com. Free. Pays 45% to featured artists on every spin.\n2. The MLC — US mechanical royalties from all streaming. $424M+ in unmatched royalties sitting in their black box right now. Register at themlc.com. Free.\n3. ASCAP or BMI — performance royalties every time your music is played publicly. Register every song.\n4. International neighboring rights — PPL (UK), GVL (Germany), SENA (Netherlands). If you're getting foreign streams, this money exists and isn't reaching you.\n\n${platformNote ? `You're ${platformNote} — make sure your registrations use the exact same artist name and metadata.` : "Every registration needs to match your distributor's metadata exactly or royalties won't match."}`;
}

function respondSoundExchange(name: string): string {
  return `${name}, SoundExchange collects US digital performance royalties for master recordings — Pandora, SiriusXM, iHeart Radio digital, and any webcaster paying under a statutory license. If you're not registered, 100% of that money is being held or lost.\n\nRegister at soundexchange.com (free). You need:\n- Your legal name and artist name\n- Bank account for direct deposit\n- ISRCs for every track\n\nSplit: 50% to the sound recording owner (you if self-released), 45% to the featured artist, 5% to non-featured performers. If you own your masters and performed on them, you get 95% of that pool — not the 50% many artists assume.`;
}

function respondMLC(name: string): string {
  return `${name}, The MLC (Mechanical Licensing Collective) collects US digital mechanical royalties — money paid every time your songs are streamed in America. Every streaming service (Spotify, Apple Music, Amazon, etc.) pays into this pool.\n\nThere's $424M+ in unmatched royalties sitting in their black box — money owed to songwriters who haven't registered.\n\nRegister at themlc.com (free). You need:\n- songwriter + publisher info\n- ISWC codes for each composition (or apply for them)\n- Works registered with your PRO first (ASCAP/BMI)\n\nThis is separate from SoundExchange. SoundExchange = master recording royalties. The MLC = composition royalties for streaming mechanicals. You need both if you write and record your own music.`;
}

function respondPRO(name: string): string {
  return `${name}, a PRO (Performing Rights Organization) collects performance royalties every time your songs are played publicly — streaming, radio, TV, live shows, restaurants, anywhere.\n\nUS options:\n- ASCAP — open to all, pays quarterly\n- BMI — open to all, pays quarterly\n- SESAC — invitation only\n\nYou can only be a member of one. Pick one and register every song you release immediately — not after it starts getting traction, before.\n\nYou also need to register your own publishing company with your PRO to collect the publisher's share (50% of performance royalties). It takes 10 minutes and costs nothing. If you don't, the publisher's 50% either sits uncollected or goes to a music publisher you've never met.`;
}

function respondISRC(name: string): string {
  return `${name}, an ISRC (International Standard Recording Code) is the unique identifier for each recording. Without it, royalties can't be matched to you across SoundExchange, PPL, The MLC, or any other collection body.\n\nGet ISRCs:\n- Free through USISRC.org if you register as a registrant\n- Auto-assigned by most distributors (DistroKid, TuneCore, CD Baby) at upload\n- Format: CC-XXX-YY-NNNNN\n\nEvery recording needs one — including alternate mixes, live versions, and remixes. One ISRC per recording, not per song. Register the ISRC with your PRO and SoundExchange separately after you get it.`;
}

function respondPublishing(name: string): string {
  return `${name}, "publishing" means owning and administering the rights to the compositions (the lyrics and melody) — separate from the master recording.\n\nIf you write your own songs and distribute independently, you own both. But collecting is different:\n\n- Performance royalties → your PRO (ASCAP/BMI)\n- US mechanical (streaming) → The MLC\n- International mechanical → a publishing admin deal\n\nBest move for most independent artists: get a publishing admin deal with Songtrust ($100 one-time + 15% fee), DistroKid Publishing, or TuneCore Publishing. They handle global registration and collection across 50+ collection societies for a cut — you keep full ownership.\n\nDo this before your catalog grows larger. The more songs you have unregistered, the more money has already been lost.`;
}

function respondContracts(name: string): string {
  return `${name}, before signing anything, check for these immediately:\n\n🔴 Critical:\n- "In perpetuity" — rights never revert. Get a reversion clause.\n- Audit right waiver — you can't verify their accounting. Never give this up.\n\n🟠 High risk:\n- 360 deal language — they take % of touring, merch, endorsements. Carve out what you can.\n- Cross-collateralization — one flop can eat a hit's royalties. Ring-fence by project.\n- No release commitment — they can shelf you and block you from going elsewhere.\n- Work-for-hire on masters — they own your recordings, not you.\n\n🟡 Watch:\n- Controlled composition clause — reduces your mechanical rate to 75% of statutory on your own songs.\n- Broad power of attorney — they can sign deals in your name.\n\nAlways get an entertainment attorney to review before signing anything with a major or distributor. NOLO's music law resources are free if you need to understand terms first.`;
}

function respondSpotify(songs: SongCatalogItem[], name: string): string {
  const hasSongs = songs.length > 0;
  return `${name}, Spotify's algorithm responds to behavior signals — not just stream counts:\n\n1. Save rate in the first 48-72 hours signals quality to the algorithm\n2. Low skip rate (listeners finishing the track) is weighted heavily\n3. Playlist adds trigger Discover Weekly and Release Radar\n4. Repeat listens and library adds push you into Daily Mixes\n\nFor editorial playlists: pitch through Spotify for Artists at least 7 days before release. One editorial pick triggers all the algorithmic playlists that follow.\n\n${hasSongs ? `For your releases: claim your artist profile on Spotify for Artists if you haven't, then pitch each song individually. The pitch form asks for mood, genre, instruments, and what makes this song different from your catalog — be specific, not vague.` : "Claim your Spotify for Artists profile first — that's where editorial pitching lives."} Canvas (looping video on the track) increases saves by 5-10% on average — worth adding for every release.`;
}

function respondAppleMusic(name: string): string {
  return `${name}, Apple Music pays ~$0.01 per stream — roughly 2-3x Spotify per play. For artists with a quality audience, that gap adds up fast.\n\nPitch to Apple Music editorial through Apple Music for Artists — submit at least 10 days before release. Their editorial team is smaller than Spotify's but their playlist features drive serious streams for catalog and new releases.\n\nSpatial Audio (Dolby Atmos): Apple surfaces Spatial Audio tracks in dedicated playlists and search. If your distributor supports stem delivery (DistroKid, TuneCore, LANDR), upload stems and request Atmos mastering — it's free through Apple. This puts your track in a separate playlist tier most artists skip.`;
}

function respondDSPs(name: string): string {
  return `${name}, each DSP has a different payout structure and audience:\n\n- Spotify: $0.003-0.005/stream, 600M users, strongest algorithm\n- Apple Music: ~$0.01/stream, more editorial driven, Atmos opportunity\n- TIDAL: ~$0.013/stream, artist-centric model, smallest but highest-value listeners\n- Amazon Music: $0.004-0.008/stream, Alexa voice search = discoverability angle\n- YouTube Music: lower per-stream but Content ID on all uploads = extra revenue\n- SoundCloud: fan-powered royalties — your actual fans' subscription money goes to you directly\n- Bandcamp: artist keeps 82-92%, best for direct fan relationships and merch\n\nPrioritize Spotify + Apple for reach. Add TIDAL for rate if you have dedicated fans. Register Content ID on YouTube regardless.`;
}

function respondPlaylist(name: string): string {
  return `${name}, playlist strategy in order of impact:\n\n1. Editorial (highest impact) — pitch through Spotify for Artists and Apple Music for Artists before release. One editorial pick = cascade of algorithmic playlists.\n\n2. Independent curators — SubmitHub ($1-3/submission, curator reviews guaranteed), Groover (same model, strong in Europe), Playlist Supply (free for some genres).\n\n3. Direct outreach — find curators on Chartmetric or SpotOnTrack. Email directly. Keep it under 150 words: song name, genre/mood, why it fits their specific playlist, ISRC, and a streaming link.\n\nWhat curators actually care about:\n- Does it fit the playlist vibe (specific, not broad)\n- Professional artwork and profile\n- Some momentum already (saves, streams, comments)\n- Clean metadata\n\nDon't pitch "for any playlist" — pitch for the specific playlist by name and say why.`;
}

function respondTikTok(name: string): string {
  return `${name}, TikTok discovery works differently from every other platform:\n\n- The algorithm serves based on content completion and shares — not followers\n- Your first 1-3 seconds determine if someone scrolls\n- The goal isn't promoting the song — it's creating a moment the song lives in\n- Trending sounds are created by use, not by editorial — your track becoming a "sound" is exponential\n\nPractical moves:\n1. Pick the most emotionally loaded 15 seconds of your song\n2. Build content around a feeling or story — not "new song out now"\n3. Post the same audio multiple times with different visuals to find what lands\n4. Consistency beats virality: 3-5 posts/week keeps you in the rotation\n\nBest performing content types for music: emotional hooks, behind-the-scenes recording moments, artist reaction to first play, before/after listening to a verse that hits hard.`;
}

function respondMarketing(name: string): string {
  return `${name}, the modern release cycle that actually works:\n\nWeeks 4-8 out:\n- Deliver to distributor (Spotify editorial pitch needs 7+ days, shoot for 4 weeks)\n- Set up pre-save link (Linkfire, Feature.fm, Toneden)\n- Brief any press contacts\n\nWeeks 1-2 out:\n- Push pre-saves across all channels\n- Teaser content: snippet, lyric reveal, BTS\n- Pitch independent playlist curators (SubmitHub/Groover)\n\nRelease week:\n- Drive saves in the first 48-72 hours — that's when the algorithm decides if it amplifies\n- Short-form content daily on TikTok/Reels/Shorts\n- Engage every comment reply\n\nPost-release (weeks 2-4):\n- Studio reaction content, fan engagement clips\n- Pursue playlist adds with early streaming data in hand\n- Pitch blogs and press now that you have numbers\n\nEmail list is the most underrated tool: no algorithm, no platform risk, direct to your fans.`;
}

function respondSync(name: string): string {
  return `${name}, sync licensing (TV, film, ads, games) requires two licenses for every placement — master license (you, if self-released) and sync license (the composition owner). If you write and record yourself, you control both.\n\nTypical fees:\n- Network TV episode: $2,500-50,000 per side\n- Streaming TV (Netflix/HBO): $5,000-75,000 per side\n- National commercial: $25,000-500,000+ per side\n- Indie film: $500-5,000 per side\n\nHow to get placed:\n1. Non-exclusive libraries (Epidemic Sound, Musicbed, Artlist) — lower rates but volume\n2. Sync agents — pitch your catalog to agents who have supervisor relationships\n3. Direct to music supervisors — LinkedIn, Film Music Network, networking events\n\nWhat supervisors need:\n- Clean split sheet and ownership documentation\n- ISRC and ISWC registered\n- Stems available (full mix, instrumental, a cappella minimum)\n- Clearable rights — one person who can say yes fast\n\nPRO cue sheets: when your music lands on TV, the production company files a cue sheet with your PRO — that generates performance royalties for every broadcast for years.`;
}

function respondLive(name: string): string {
  return `${name}, live deal structures you'll encounter:\n\n- Flat guarantee: you get paid regardless of turnout. Best for emerging artists building an audience.\n- Door deal: you take a % of ticket sales (70/30 or 80/20 in your favor) after venue expenses. Higher ceiling, more risk.\n- Guarantee vs. percentage: you get whichever is higher. Most common and most fair.\n\nAlways get the settlement after every show — box office statement, itemized expenses, and your deal applied to the net. Sign it. Keep copies.\n\nBooking agents take 10-15% of gross performance fees. Worth it once you're playing beyond your local market — they have the venue relationships and booking infrastructure you'd spend months building.\n\nMerch at the door: negotiate hard here. Standard venue split is 80/20 or 85/15 in your favor. Never let them take more than 20%. On a good night, merch can match or beat the performance fee.`;
}

function respondFinance(songs: SongCatalogItem[], name: string): string {
  const hasSongs = songs.length > 0;
  const summary = hasSongs ? getRevenueGapSummary(songs) : null;

  return `${name}, what 1 million streams actually pays:\n\n- Master side (~$0.004 avg across DSPs): $4,000 if you own 100% of your masters\n- Publishing side (composition): $600-800 additional\n- Total if you own everything: ~$4,600-4,800 per million streams\n- If signed to a label at 20% royalty: you see ~$800-960\n\n${summary && summary.totalEstimatedGap > 0 ? `Your current uncollected gap is ${formatGapEstimate(summary.totalEstimatedGap)} — that's real money sitting in collection bodies waiting to be claimed. That's where to focus before chasing new streams.\n\n` : ""}Revenue streams independent artists often miss:\n1. SoundExchange (digital radio)\n2. The MLC (US mechanical streaming)\n3. International neighboring rights (PPL, GVL, SENA)\n4. YouTube Content ID on all uploads\n5. Bandcamp direct sales\n6. Sync licensing (one placement can dwarf months of streaming)`;
}

function respondGreeting(songs: SongCatalogItem[], platforms: PlatformConnection[], name: string, managerName: string): string {
  const hasSongs = songs.length > 0;
  if (hasSongs) {
    const summary = getRevenueGapSummary(songs);
    const score = getCatalogReadinessScore(songs);
    return `${name}, I'm ${managerName}. I've got your catalog loaded — ${songs.length} song${songs.length !== 1 ? "s" : ""}, ${score}% readiness, ${formatGapEstimate(summary.totalEstimatedGap)} in open gaps.\n\nAsk me: what's my biggest gap, how do I pitch playlists, what's wrong with this contract clause, what should I register first, how does SoundExchange work — anything music business. I'll be specific.`;
  }
  return `${name}, I'm ${managerName} — your music manager built into Pocket Manager. Add songs to your catalog and I can pull your actual gaps, priority actions, and revenue paths.\n\nWhile you're setting up, ask me anything: royalties, streaming strategy, contracts, sync licensing, release planning, playlist pitching. I'll give you direct answers with real numbers.`;
}

function respondFallback(songs: SongCatalogItem[], name: string, managerName: string): string {
  const hasSongs = songs.length > 0;
  const top = hasSongs ? topGapLine(songs) : "";
  return `${name}, I'm ${managerName}. I'm best at: royalty gaps, streaming strategy, release planning, contract red flags, sync licensing, and what to do with your actual catalog data. ${top ? `Right now: ${top}` : "Add songs to your catalog and I can get specific."}\n\nAsk "what should I do next" and I'll give you your priority action list.`;
}

// ─── Main Chat Response Generator ────────────────────────────────────────────

export function generateChatResponse(input: ChatInput): string {
  const { lastMessage, songs, platforms, artistName, managerName, page } = input;
  const intent = detectIntent(lastMessage, page);
  const name = artistName || "you";
  const mgr = managerName || "REMY";

  switch (intent) {
    case "gap":          return respondGap(songs, platforms, name);
    case "readiness":    return respondReadiness(songs, name);
    case "royalties":    return respondRoyalties(platforms, name);
    case "soundexchange": return respondSoundExchange(name);
    case "mlc":          return respondMLC(name);
    case "pro":          return respondPRO(name);
    case "isrc":         return respondISRC(name);
    case "publishing":   return respondPublishing(name);
    case "contracts":    return respondContracts(name);
    case "spotify":      return respondSpotify(songs, name);
    case "apple":        return respondAppleMusic(name);
    case "tidal":        return `${name}, TIDAL pays ~$0.013/stream — the highest rate of any major DSP. Their artist-centric model means money flows more to artists people actively seek out (not background listening). Smaller user base but higher engagement per listener. Worth distributing to via any major distributor. No special pitch portal — editorial is invite-based.`;
    case "dsps":         return respondDSPs(name);
    case "playlist":     return respondPlaylist(name);
    case "tiktok":       return respondTikTok(name);
    case "marketing":    return respondMarketing(name);
    case "sync":         return respondSync(name);
    case "live":         return respondLive(name);
    case "finance":      return respondFinance(songs, name);
    case "greeting":     return respondGreeting(songs, platforms, name, mgr);
    default:             return respondFallback(songs, name, mgr);
  }
}

// ─── Pitch Email Generator ────────────────────────────────────────────────────

export function generatePitch(input: PitchInput): { subject: string; body: string } {
  const { artistName, artistContact, emotionalStory, song, curator } = input;
  const platform = curator.platform || "Spotify";
  const genre = song.genre || "independent";
  const mood = song.mood || "";
  const contact = artistContact || artistName;
  const hasStory = !!(emotionalStory && emotionalStory.trim().length > 20);

  // Rotate templates by a simple hash of song title
  const hash = song.title.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const variant = hasStory ? 0 : hash % 3;

  if (variant === 0 && hasStory) {
    // Story-first (best when emotional story is provided)
    const storyLine = emotionalStory!.trim().slice(0, 120).replace(/\.$/, "");
    return {
      subject: `${song.title} for ${curator.playlistName}`,
      body: `${curator.name},\n\n"${song.title}" came from this: ${storyLine}.\n\nGenre: ${genre}${mood ? ` / ${mood}` : ""}${song.bpm ? ` / ${song.bpm}bpm` : ""}. Released ${song.releaseDate || "recent"}.${song.isrc ? `\nISRC: ${song.isrc}` : ""}\n\nWould it work for ${curator.playlistName}? Happy to send stems or anything else you need.\n\n— ${artistName}\n${contact}`,
    };
  }

  if (variant === 1) {
    // Direct / numbers-led
    return {
      subject: `${artistName} — "${song.title}" for ${curator.playlistName}`,
      body: `Hey ${curator.name},\n\nSubmitting "${song.title}" for ${curator.playlistName} on ${platform}.\n\n${genre}${mood ? ` / ${mood}` : ""}${song.bpm ? ` / ${song.bpm}bpm` : ""}. Released ${song.releaseDate || "recently"}.${song.isrc ? `\nISRC: ${song.isrc}` : ""}\n\nClean fit for the ${curator.genre || curator.playlistType || "playlist"} direction you're running. Let me know if you need stems or promo assets.\n\n${artistName}\n${contact}`,
    };
  }

  if (variant === 2) {
    // Question hook
    return {
      subject: `"${song.title}" — right for ${curator.playlistName}?`,
      body: `${curator.name} —\n\n"${song.title}" by ${artistName}. ${genre}${mood ? ` / ${mood}` : ""}${song.bpm ? ` / ${song.bpm}bpm` : ""}.\n\n${curator.genre || curator.playlistType ? `Fits the ${curator.genre || curator.playlistType} focus of ${curator.playlistName}.` : `Fits the ${curator.playlistName} energy.`}${song.isrc ? `\n\nISRC: ${song.isrc}` : ""}\n\n${contact}`,
    };
  }

  // Variant 3: context-aware
  return {
    subject: `${genre} pick for ${curator.playlistName} — "${song.title}"`,
    body: `${curator.name},\n\nCame across ${curator.playlistName} — the ${curator.genre || genre} direction is an exact match for where "${song.title}" lives.\n\n${mood ? `Mood: ${mood}. ` : ""}${song.bpm ? `${song.bpm}bpm. ` : ""}Released ${song.releaseDate || "recently"}.${song.isrc ? `\nISRC: ${song.isrc}. Stems available.` : ""}\n\n${artistName} · ${contact}`,
  };
}

// ─── Contract Scanner ─────────────────────────────────────────────────────────

interface RedFlagDef {
  label: string;
  pattern: RegExp;
  risk: "Low" | "Medium" | "High" | "Critical";
  plainEnglish: string;
  attorneyQuestion: string;
}

const RED_FLAG_DEFS: RedFlagDef[] = [
  {
    label: "Perpetuity clause",
    pattern: /in perpetuity|throughout the universe|forever and ever|for the full term of copyright/gi,
    risk: "Critical",
    plainEnglish: "They own your work forever with no reversion. One of the most dangerous clauses in any music contract — there is no end date.",
    attorneyQuestion: "Can we add a reversion clause that returns rights to me after 5-10 years if they fail to actively exploit the work?",
  },
  {
    label: "360 deal / multiple rights",
    pattern: /360[- ]degree|multiple rights deal|all entertainment income|touring.*commission|merchandise.*commission|endorsement.*commission|live performance.*percentage/gi,
    risk: "High",
    plainEnglish: "The label takes a cut of everything you earn — live shows, merch, sponsorships, and acting work — not just music. They're taking equity in your whole career.",
    attorneyQuestion: "Which specific income streams are subject to this clause and can we carve out live performance, pre-existing endorsements, and merchandise?",
  },
  {
    label: "Cross-collateralization",
    pattern: /cross[- ]collateral|recoup.*across.*all|all albums.*recoup|all recordings.*recoup|products.*cross/gi,
    risk: "High",
    plainEnglish: "Losses from one project eat royalties from another. A hit album can be held hostage by a flopped project until everything recouped across the board.",
    attorneyQuestion: "Can we ring-fence each album or project so recoupment is calculated independently per project?",
  },
  {
    label: "Broad recoupment",
    pattern: /recording costs.*recoupable|all costs.*recoup|marketing.*recoupable|recoup.*all advances|one hundred percent.*recoup/gi,
    risk: "High",
    plainEnglish: "You repay not just the cash advance, but also recording costs and sometimes marketing budgets before you see a royalty dollar. The 'advance' is actually a loan against your future earnings.",
    attorneyQuestion: "What is the complete list of recoupable costs and is there a cap on recoupable marketing expenses?",
  },
  {
    label: "Audit right waiver",
    pattern: /no right to audit|waive.*audit|audit.*not permitted|right to audit.*limited|no audit/gi,
    risk: "Critical",
    plainEnglish: "You cannot verify their accounting. If they underpay, you have no mechanism to prove it. Never give up audit rights under any circumstances.",
    attorneyQuestion: "Can we restore full audit rights — at least once per year with 30 days notice — as a non-negotiable condition?",
  },
  {
    label: "Work-for-hire on recordings",
    pattern: /work[- ]for[- ]hire|work made for hire|master.*(?:owned|property) of (?:label|company)|recordings.*property of/gi,
    risk: "High",
    plainEnglish: "The label legally created the recordings — you didn't. Copyright belongs to them from day one, not a license, an outright ownership transfer.",
    attorneyQuestion: "Can this be restructured as a license deal where I retain master ownership and license the recordings for a defined term and territory?",
  },
  {
    label: "Unilateral option periods",
    pattern: /option.*sole.*discretion|sole.*option.*exercise|label.*right.*extend|sole.*discretion.*renew|company.*option/gi,
    risk: "High",
    plainEnglish: "They can extend the contract at their choice, not yours. You could be locked in years beyond the initial term with no ability to leave.",
    attorneyQuestion: "Can option periods require a minimum release commitment before each option can be exercised, or require mutual agreement?",
  },
  {
    label: "No release commitment",
    pattern: /no obligation.*release|not obligated.*distribute|may.*choose.*not.*release|right.*not.*release|shelf.*right/gi,
    risk: "High",
    plainEnglish: "They can sign you, take your recordings, and never release them. You're in limbo and can't go elsewhere while they sit on your music.",
    attorneyQuestion: "Can we add a firm release commitment with a reversion clause triggering ownership return if they fail to release within 12-18 months?",
  },
  {
    label: "Broad power of attorney",
    pattern: /power of attorney|attorney[- ]in[- ]fact|execute.*on.*(?:your|artist).*behalf|sign.*agreements.*on.*behalf/gi,
    risk: "Medium",
    plainEnglish: "They can sign contracts and agreements in your name without asking you first. Broad power of attorney in a music deal is almost always overreaching.",
    attorneyQuestion: "Can we limit power of attorney strictly to mechanical license registrations and copyright filings — excluding any deal-making authority?",
  },
  {
    label: "All-in royalty structure",
    pattern: /all[- ]in.*royalt|inclusive.*royalt|royalt.*include.*producer|artist.*royalt.*includes.*all/gi,
    risk: "High",
    plainEnglish: "Your royalty rate looks good but it includes producer points, which are deducted from your share — not the label's. Your real effective rate is much lower than stated.",
    attorneyQuestion: "What is the net artist royalty after all producer, mixer, and third-party deductions, and are those deductions coming from the label's margin or mine?",
  },
  {
    label: "Controlled composition clause",
    pattern: /controlled composition|75%.*statutory|three[- ]quarter.*rate|statutory.*rate.*controlled|reduced.*mechanical.*rate/gi,
    risk: "Medium",
    plainEnglish: "If you wrote the songs, the label pays you mechanical royalties at 75% of the statutory rate — not 100%. You collect less money from songs you wrote yourself.",
    attorneyQuestion: "Can we negotiate 100% of statutory mechanical rates on all controlled compositions, particularly for digital formats and streaming?",
  },
  {
    label: "Broad name and likeness",
    pattern: /name.*likeness.*(?:forever|perpetuity)|likeness.*name.*voice.*(?:all|any|perpetual)|right to use.*name.*(?:any|all) purpose/gi,
    risk: "Medium",
    plainEnglish: "They can use your name, image, and voice broadly — potentially for things unrelated to promoting your music. Check if this extends beyond normal marketing.",
    attorneyQuestion: "Is this limited strictly to marketing music released under this agreement, or can they use my likeness for other commercial purposes?",
  },
];

const POSITIVE_PATTERNS: { pattern: RegExp; text: string }[] = [
  { pattern: /reversion clause|rights.*revert|revert.*rights/i, text: "Contains a reversion clause — rights can return to you under specified conditions" },
  { pattern: /right to audit|audit rights?/i, text: "Audit rights included — you can verify their accounting" },
  { pattern: /artist.*(?:creative|release).*approval|creative.*approval.*artist/i, text: "Creative approval rights mentioned" },
  { pattern: /limited.*territory|specific.*territory|(?:US|UK|domestic) only/i, text: "Territory is limited — not a worldwide rights grab" },
  { pattern: /(?:one|two|1|2)[- ]year.*term|short.*initial.*term/i, text: "Short initial term — limited initial commitment" },
  { pattern: /reversion.*failure.*release|failure.*release.*revert/i, text: "Release obligation with reversion — they must release or rights return to you" },
];

export function scanContract(text: string, contractType?: string): ContractAnalysis {
  const flags: ContractFlag[] = [];

  for (const def of RED_FLAG_DEFS) {
    const match = text.match(def.pattern);
    if (!match) continue;

    const idx = text.search(def.pattern);
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + 180);
    const excerpt = text.slice(start, end).replace(/\s+/g, " ").trim();

    flags.push({
      label: def.label,
      risk: def.risk,
      excerpt,
      plainEnglish: def.plainEnglish,
      attorneyQuestion: def.attorneyQuestion,
    });
  }

  const positives: string[] = [];
  for (const p of POSITIVE_PATTERNS) {
    if (p.pattern.test(text)) positives.push(p.text);
  }

  // Risk score: Critical=10, High=5, Medium=2, Low=1
  const score = flags.reduce((acc, f) => {
    if (f.risk === "Critical") return acc + 10;
    if (f.risk === "High") return acc + 5;
    if (f.risk === "Medium") return acc + 2;
    return acc + 1;
  }, 0);

  const overallRisk: ContractAnalysis["overallRisk"] =
    score >= 20 ? "Critical" : score >= 10 ? "High" : score >= 4 ? "Medium" : "Low";

  const type = contractType || "music agreement";
  const flagCount = flags.length;

  let summary: string;
  if (flagCount === 0) {
    summary = `This ${type} appears relatively clean — no major red flags detected in the language scanned. Review the full document manually and confirm all key terms with an entertainment attorney before signing.`;
  } else if (overallRisk === "Critical") {
    summary = `This ${type} contains ${flagCount} flagged clause${flagCount !== 1 ? "s" : ""} including critical provisions that could permanently damage your rights or income. Do not sign without legal review.`;
  } else if (overallRisk === "High") {
    summary = `This ${type} has ${flagCount} flagged clause${flagCount !== 1 ? "s" : ""} that carry meaningful risk to your ownership or earnings. Several are negotiable. Get an entertainment attorney to review before proceeding.`;
  } else {
    summary = `This ${type} has ${flagCount} flagged clause${flagCount !== 1 ? "s" : ""} worth reviewing. Most are standard but should be understood clearly. An attorney review is recommended before signing anything.`;
  }

  const nextSteps: string[] = [
    "Share this analysis with an entertainment attorney before making any decisions",
    "Negotiate reversion rights on any perpetuity or long-term ownership clauses",
    "Confirm the complete list of recoupable costs and get a cap in writing",
    flagCount > 0 ? "Request a redline with specific changes to the flagged clauses before counter-signing" : "Request any changes you've discussed be reflected in a final redlined draft",
    "Do not sign until all Critical and High risk items are resolved or explicitly waived with full understanding",
  ];

  return { summary, overallRisk, flags, positives, nextSteps };
}
