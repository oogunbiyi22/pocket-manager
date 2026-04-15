/**
 * Platform Integration Registry
 * ─────────────────────────────
 * Single source of truth for every platform Pocket Manager supports.
 * Add new platforms by appending entries — no other code changes needed.
 *
 * URL policy: every `connectUrl` must point to the EXACT action page,
 * not the platform homepage. URLs are validated on build.
 */

export type PlatformCategory =
  | "distributor"
  | "pro"           // Performing Rights Organization
  | "digital_performance" // SoundExchange-type
  | "mechanical"    // The MLC, Songtrust
  | "publishing"    // Publishing admin / sub-publisher
  | "analytics"     // Spotify for Artists, Apple Music for Artists
  | "content_id"    // YouTube, Rumble
  | "identity";     // ISNI, MusicBrainz

export type ConnectionMethod =
  | "oauth"            // Real OAuth redirect — we hold the token
  | "guided_external"  // User completes on external site, comes back and confirms
  | "manual";          // User enters a token / ID / connects manually

export type PlatformStatus =
  | "not_connected"
  | "connecting"
  | "connected"
  | "incomplete"
  | "error"
  | "reconnect_required";

export type PlatformEntry = {
  id: string;
  name: string;
  shortName?: string;
  category: PlatformCategory;
  connectionMethod: ConnectionMethod;
  icon: string; // emoji or letter
  tagline: string; // one sentence — what they do
  moneyType: string; // e.g. "Digital performance royalties"
  whyItMatters: string; // why uncollected = real money lost
  estimatedMinutes: number;

  // URLs — must be EXACT destination pages, not homepages
  connectUrl: string;        // primary CTA URL
  payoutUrl?: string;        // banking / payment setup URL
  repertoireUrl?: string;    // where to register individual songs
  searchUnclaimedUrl?: string; // for platforms with unclaimed money pools

  // Step-by-step instructions shown before opening external URL
  steps: string[];

  // What to bring / have ready
  requires?: string[];

  // After user returns, what to show as confirmation prompt
  confirmPrompt: string;

  // Group label for UI display
  group: "Distributor" | "PRO" | "Digital Performance" | "Publishing" | "Analytics" | "Content ID" | "Identity";
};

export const PLATFORM_REGISTRY: PlatformEntry[] = [
  // ──────────────────────────────────────────────────────────────
  // DISTRIBUTORS
  // ──────────────────────────────────────────────────────────────
  {
    id: "distrokid",
    name: "DistroKid",
    category: "distributor",
    connectionMethod: "guided_external",
    group: "Distributor",
    icon: "🎵",
    tagline: "Distribute your music to every DSP and keep 100% of royalties.",
    moneyType: "Streaming distribution payouts",
    whyItMatters: "Your bank info must be verified for payouts to land. Unverified accounts hold your money until you fix it.",
    estimatedMinutes: 3,
    connectUrl: "https://distrokid.com/bank",
    payoutUrl: "https://distrokid.com/bank",
    repertoireUrl: "https://distrokid.com/dashboard",
    steps: [
      "Log in to your DistroKid account",
      "Go to Bank → add or verify your bank account / PayPal",
      "Confirm your tax info is submitted (W-9 or W-8BEN)",
    ],
    requires: ["Bank account or PayPal", "SSN or EIN for W-9"],
    confirmPrompt: "My bank account is verified and payout is enabled",
  },
  {
    id: "tunecore",
    name: "TuneCore",
    category: "distributor",
    connectionMethod: "guided_external",
    group: "Distributor",
    icon: "🎵",
    tagline: "Distribute and keep 100% of royalties with annual subscription pricing.",
    moneyType: "Streaming distribution payouts",
    whyItMatters: "TuneCore requires a verified payout method before sending your earnings. Money can sit uncollected for months.",
    estimatedMinutes: 3,
    connectUrl: "https://www.tunecore.com/account",
    payoutUrl: "https://www.tunecore.com/account#payment",
    steps: [
      "Log in to TuneCore",
      "Go to Account Settings → Payment",
      "Add or verify your bank account or PayPal",
      "Submit your tax form if prompted",
    ],
    requires: ["Bank account details", "Tax ID"],
    confirmPrompt: "My payment method is verified in TuneCore",
  },
  {
    id: "cdbaby",
    name: "CD Baby",
    category: "distributor",
    connectionMethod: "guided_external",
    group: "Distributor",
    icon: "🎵",
    tagline: "Distribute music and access CD Baby Pro for publishing administration.",
    moneyType: "Streaming distribution payouts + publishing admin",
    whyItMatters: "CD Baby Pro automatically registers your songs with The MLC and your PRO. Without it you miss mechanical and performance royalties.",
    estimatedMinutes: 5,
    connectUrl: "https://members.cdbaby.com/",
    payoutUrl: "https://members.cdbaby.com/account/payment",
    steps: [
      "Log in to CD Baby",
      "Go to Account → Payment Settings",
      "Add your bank account or check/PayPal details",
      "Consider upgrading to CD Baby Pro for automatic PRO + MLC registration",
    ],
    requires: ["Bank account", "Tax ID"],
    confirmPrompt: "My CD Baby payout is set up and active",
  },
  {
    id: "onerpm",
    name: "ONErpm",
    category: "distributor",
    connectionMethod: "guided_external",
    group: "Distributor",
    icon: "🎵",
    tagline: "Distribution and artist services with advances for qualifying artists.",
    moneyType: "Streaming distribution payouts",
    whyItMatters: "ONErpm's partner portal controls when and how you get paid. Unconfigured payout = delayed earnings.",
    estimatedMinutes: 5,
    connectUrl: "https://onerpm.com/partner/login",
    payoutUrl: "https://onerpm.com/partner/settings/payment",
    steps: [
      "Log in to the ONErpm Partner Portal",
      "Navigate to Settings → Payment",
      "Add your bank account or payment method",
      "Submit tax documentation if required",
    ],
    requires: ["ONErpm partner account", "Bank details"],
    confirmPrompt: "My ONErpm payment method is configured",
  },
  {
    id: "unitedmasters",
    name: "UnitedMasters",
    category: "distributor",
    connectionMethod: "guided_external",
    group: "Distributor",
    icon: "🎵",
    tagline: "Distribution with brand deal opportunities through the UnitedMasters Select program.",
    moneyType: "Streaming royalties + brand deals",
    whyItMatters: "Without a verified payout method, earnings accumulate but aren't released to you.",
    estimatedMinutes: 5,
    connectUrl: "https://app.unitedmasters.com/",
    payoutUrl: "https://app.unitedmasters.com/settings/payout",
    steps: [
      "Open the UnitedMasters app",
      "Go to Settings → Payout",
      "Link your bank account via Stripe",
    ],
    requires: ["Bank account"],
    confirmPrompt: "My UnitedMasters bank account is linked",
  },

  // ──────────────────────────────────────────────────────────────
  // PROs — Performing Rights Organizations
  // ──────────────────────────────────────────────────────────────
  {
    id: "ascap",
    name: "ASCAP",
    category: "pro",
    connectionMethod: "guided_external",
    group: "PRO",
    icon: "🎼",
    tagline: "Collects and distributes performance royalties for songwriters and publishers.",
    moneyType: "Performance royalties (radio, TV, streaming, live)",
    whyItMatters: "Every unregistered song is leaving performance royalty money uncollected. ASCAP registration is retroactive — songs can be claimed going back years.",
    estimatedMinutes: 10,
    connectUrl: "https://www.ascap.com/help/career-development/songwriter-composer-publisher-guide",
    repertoireUrl: "https://ace.ascap.com/",
    steps: [
      "Go to ascap.com and create a Writer account ($50 one-time fee)",
      "Enter your artist name, legal name, and contact info",
      "After registration, go to ACE (ascap.com) → My Works",
      "Register each song: title, ISRC, release date, and your writer share percentage",
    ],
    requires: ["$50 registration fee", "ISRC for each song", "Writer share percentages"],
    confirmPrompt: "I've registered with ASCAP and added my songs",
    searchUnclaimedUrl: "https://www.ascap.com/ace",
  },
  {
    id: "bmi",
    name: "BMI",
    category: "pro",
    connectionMethod: "guided_external",
    group: "PRO",
    icon: "🎼",
    tagline: "The largest PRO in the US — free for songwriters, collects performance royalties globally.",
    moneyType: "Performance royalties (radio, TV, streaming, live)",
    whyItMatters: "BMI is free to join. Every day your songs play anywhere without BMI registration is a day performance royalties go uncollected.",
    estimatedMinutes: 10,
    connectUrl: "https://www.bmi.com/creators/join",
    repertoireUrl: "https://repertoire.bmi.com/",
    steps: [
      "Go to bmi.com/creators/join — it's free for songwriters",
      "Complete the songwriter application with your legal and artist name",
      "Once approved, go to Repertoire (repertoire.bmi.com)",
      "Register each song with title, ISRC, release date, and your writer/publisher share",
    ],
    requires: ["ISRC for each song", "Writer split percentages (must total 100%)"],
    confirmPrompt: "I've joined BMI and registered my songs in Repertoire",
    searchUnclaimedUrl: "https://repertoire.bmi.com/",
  },
  {
    id: "sesac",
    name: "SESAC",
    category: "pro",
    connectionMethod: "guided_external",
    group: "PRO",
    icon: "🎼",
    tagline: "Invite-only PRO with a strong international network and faster payout cycles.",
    moneyType: "Performance royalties (selective, stronger in gospel/Christian/country)",
    whyItMatters: "SESAC's invite-only model means higher per-work payouts for affiliated writers. If you qualify, switching PROs can meaningfully increase your earnings.",
    estimatedMinutes: 15,
    connectUrl: "https://www.sesac.com/licensing/affiliate-with-us/",
    steps: [
      "Submit an application at sesac.com/licensing/affiliate-with-us",
      "SESAC reviews and invites — approval takes 2–4 weeks",
      "Once accepted, log in to register your works in the SESAC portal",
    ],
    requires: ["Existing performance history", "Invitation or referral preferred"],
    confirmPrompt: "I've applied to SESAC or have been accepted",
  },
  {
    id: "socan",
    name: "SOCAN",
    category: "pro",
    connectionMethod: "guided_external",
    group: "PRO",
    icon: "🎼",
    tagline: "Canada's PRO — required if your music is played in Canada.",
    moneyType: "Canadian performance royalties",
    whyItMatters: "If your music is on any Canadian platform or played in Canada, SOCAN owes you royalties. These don't flow through US PROs automatically.",
    estimatedMinutes: 10,
    connectUrl: "https://www.socan.com/join/",
    repertoireUrl: "https://www.socan.com/my-music/works/",
    steps: [
      "Go to socan.com/join and create a member account",
      "Register your works at socan.com/my-music/works",
      "Provide your ISRC and writer splits for each song",
    ],
    requires: ["ISRC for each song"],
    confirmPrompt: "I've joined SOCAN and registered my works",
  },
  {
    id: "prs",
    name: "PRS for Music",
    category: "pro",
    connectionMethod: "guided_external",
    group: "PRO",
    icon: "🎼",
    tagline: "UK's PRO — required if your music is played in the UK or Europe.",
    moneyType: "UK/European performance royalties",
    whyItMatters: "UK and European plays generate significant royalties. PRS membership is required to collect them — US PROs don't collect UK performance money.",
    estimatedMinutes: 10,
    connectUrl: "https://www.prsformusic.com/members/join-prs",
    steps: [
      "Go to prsformusic.com/members/join-prs",
      "Complete the songwriter membership application",
      "Register your works after approval using ISRC codes",
    ],
    requires: ["Proof of UK creative activity or UK-played music"],
    confirmPrompt: "I've applied to PRS for Music",
  },

  // ──────────────────────────────────────────────────────────────
  // DIGITAL PERFORMANCE
  // ──────────────────────────────────────────────────────────────
  {
    id: "soundexchange",
    name: "SoundExchange",
    category: "digital_performance",
    connectionMethod: "guided_external",
    group: "Digital Performance",
    icon: "📻",
    tagline: "Collects digital performance royalties for sound recording owners from internet radio, satellite, and streaming services.",
    moneyType: "Digital performance royalties (master owner + featured artist)",
    whyItMatters: "SoundExchange is completely separate from your PRO. They collect for the master recording owner — that's you. Unregistered artists have unclaimed money sitting in the SoundExchange pool right now.",
    estimatedMinutes: 15,
    connectUrl: "https://www.soundexchange.com/artist-copyright-owner/register/",
    searchUnclaimedUrl: "https://www.soundexchange.com/artist-copyright-owner/claim-royalties/",
    steps: [
      "Go to soundexchange.com/artist-copyright-owner/register",
      "Create an account and verify you are the master recording owner",
      "Add your releases — they match by artist name and song title",
      "Check the unclaimed royalties pool for your artist name",
    ],
    requires: ["Artist name", "Release info", "SSN or EIN for payouts"],
    confirmPrompt: "I've registered with SoundExchange and submitted my releases",
  },

  // ──────────────────────────────────────────────────────────────
  // MECHANICAL / PUBLISHING ADMIN
  // ──────────────────────────────────────────────────────────────
  {
    id: "mlc",
    name: "The MLC",
    category: "mechanical",
    connectionMethod: "guided_external",
    group: "Publishing",
    icon: "⚙️",
    tagline: "The Mechanical Licensing Collective — collects mechanical royalties from US streaming services.",
    moneyType: "Mechanical royalties from US digital streaming",
    whyItMatters: "The MLC holds hundreds of millions in unclaimed mechanical royalties. Every unregistered ISRC is leaving your mechanical money in the pool — it gets redistributed to other publishers if unclaimed.",
    estimatedMinutes: 20,
    connectUrl: "https://portal.themlc.com/",
    repertoireUrl: "https://portal.themlc.com/works",
    searchUnclaimedUrl: "https://portal.themlc.com/",
    steps: [
      "Create an account at portal.themlc.com",
      "Register as a songwriter / self-published (no publisher needed)",
      "Add each song using its ISRC — The MLC will match it to streaming data",
      "Submit banking info for payouts",
    ],
    requires: ["ISRC for each song", "Writer splits", "Bank account for payout"],
    confirmPrompt: "I've registered with The MLC and added my ISRCs",
  },
  {
    id: "songtrust",
    name: "Songtrust",
    category: "publishing",
    connectionMethod: "guided_external",
    group: "Publishing",
    icon: "📝",
    tagline: "Global publishing administration for independent songwriters — registers your works with 60+ societies worldwide.",
    moneyType: "Global mechanical + performance royalties across 60+ territories",
    whyItMatters: "Without a publishing admin, you can't collect mechanical or performance royalties in most international territories. Songtrust does it for a one-time fee + 15% commission.",
    estimatedMinutes: 15,
    connectUrl: "https://www.songtrust.com/register",
    steps: [
      "Create an account at songtrust.com ($100 one-time setup fee)",
      "Enter your artist and legal name, PRO affiliation",
      "Upload your catalog — Songtrust registers songs globally",
      "They handle collection from 60+ territories automatically",
    ],
    requires: ["$100 one-time fee", "PRO membership (ASCAP, BMI, or SESAC)", "Song ISRCs"],
    confirmPrompt: "I've signed up for Songtrust and submitted my catalog",
  },

  // ──────────────────────────────────────────────────────────────
  // STREAMING ANALYTICS
  // ──────────────────────────────────────────────────────────────
  {
    id: "spotify",
    name: "Spotify for Artists",
    category: "analytics",
    connectionMethod: "guided_external",
    group: "Analytics",
    icon: "🎧",
    tagline: "Claim your artist profile, access real-time stream data, and pitch unreleased music to editorial playlists.",
    moneyType: "Streaming analytics + playlist editorial pitching access",
    whyItMatters: "Without verification, you can't pitch music to Spotify's editorial team. That's the difference between 500 and 500,000 streams on release day.",
    estimatedMinutes: 5,
    connectUrl: "https://artists.spotify.com/claim",
    steps: [
      "Go to artists.spotify.com/claim",
      "Search for your artist name and select your profile",
      "Verify via your distributor email (must match the email you used to distribute)",
      "Once verified, access the Pitch tool for upcoming releases",
    ],
    requires: ["Distributor email address (DistroKid, TuneCore, etc.)"],
    confirmPrompt: "I've claimed and verified my Spotify for Artists profile",
  },
  {
    id: "apple_music",
    name: "Apple Music for Artists",
    category: "analytics",
    connectionMethod: "guided_external",
    group: "Analytics",
    icon: "🎵",
    tagline: "Access Apple Music analytics including plays, listeners, Shazams, and playlist adds.",
    moneyType: "Apple Music analytics (validates streaming statements)",
    whyItMatters: "Apple Music for Artists data lets you verify your Apple Music royalty statements are accurate. Without it, you're paying blindly.",
    estimatedMinutes: 5,
    connectUrl: "https://artists.apple.com/",
    steps: [
      "Go to artists.apple.com",
      "Sign in with your Apple ID",
      "Request access for your artist profile",
      "Verify via your distributor or label contact",
    ],
    requires: ["Apple ID", "Your distributor's contact email"],
    confirmPrompt: "I've verified my Apple Music for Artists access",
  },

  // ──────────────────────────────────────────────────────────────
  // CONTENT ID
  // ──────────────────────────────────────────────────────────────
  {
    id: "youtube",
    name: "YouTube / Content ID",
    category: "content_id",
    connectionMethod: "guided_external",
    group: "Content ID",
    icon: "▶️",
    tagline: "Monetize every fan video that uses your music via Content ID, and claim your Official Artist Channel.",
    moneyType: "Content ID royalties from user-generated videos",
    whyItMatters: "Without Content ID, every fan video using your music earns you $0. Your distributor can enable this — it generates significant passive income at scale.",
    estimatedMinutes: 5,
    connectUrl: "https://studio.youtube.com/",
    steps: [
      "Check if your distributor (DistroKid, CD Baby, TuneCore) offers Content ID delivery — most do for free or a small fee",
      "Enable Content ID in your distributor settings for each release",
      "For your Official Artist Channel: go to YouTube Studio → Customization → check OAC eligibility",
      "OAC eligibility requires multiple releases and a verified YouTube account",
    ],
    requires: ["YouTube account", "Active distributor account with Content ID enabled"],
    confirmPrompt: "My distributor has Content ID enabled for my releases",
    searchUnclaimedUrl: "https://www.youtube.com/oac",
  },

  // ──────────────────────────────────────────────────────────────
  // IDENTITY
  // ──────────────────────────────────────────────────────────────
  {
    id: "isni",
    name: "ISNI / IPI Number",
    category: "identity",
    connectionMethod: "guided_external",
    group: "Identity",
    icon: "🪪",
    tagline: "Establishes your persistent artist identity across PROs, distributors, and metadata databases.",
    moneyType: "Ensures royalties route to the correct you — not a different artist with a similar name",
    whyItMatters: "Without a verified artist identity (ISNI + IPI), royalties can be misrouted or held because databases can't confirm you're the right rights holder.",
    estimatedMinutes: 15,
    connectUrl: "https://isni.org/page/register/",
    steps: [
      "Register at isni.org/page/register — free for individuals",
      "Your IPI number is assigned when you join a PRO (ASCAP, BMI, SESAC)",
      "Use your ISNI on all registrations to ensure proper attribution",
    ],
    requires: ["PRO membership for IPI"],
    confirmPrompt: "I have my ISNI and/or IPI number",
  },
];

/** Look up a platform by its ID. Returns undefined if not found. */
export function getPlatform(id: string): PlatformEntry | undefined {
  return PLATFORM_REGISTRY.find((p) => p.id === id);
}

/** Get all platforms in a category */
export function getPlatformsByCategory(category: PlatformCategory): PlatformEntry[] {
  return PLATFORM_REGISTRY.filter((p) => p.category === category);
}

/** Get all platforms in a group */
export function getPlatformsByGroup(group: PlatformEntry["group"]): PlatformEntry[] {
  return PLATFORM_REGISTRY.filter((p) => p.group === group);
}

/**
 * Money Health items — each represents a financial setup action.
 * Status is derived from the user's platform connections.
 */
export type MoneyHealthItem = {
  id: string;
  label: string;
  description: string; // one sentence — what it does and why it matters
  platformId?: string; // links to PLATFORM_REGISTRY entry for the action modal
  actionLabel: string;
  category: "royalties" | "distribution" | "analytics" | "identity";
};

export const MONEY_HEALTH_ITEMS: MoneyHealthItem[] = [
  {
    id: "pro_registration",
    label: "PRO registration",
    description: "ASCAP, BMI, or SESAC collects performance royalties from radio, TV, and streaming — unregistered songs earn $0 from this stream.",
    platformId: "bmi", // BMI is free — default recommendation
    actionLabel: "Register now",
    category: "royalties",
  },
  {
    id: "soundexchange",
    label: "SoundExchange",
    description: "Separate from your PRO — SoundExchange collects for the master recording owner. There may be unclaimed money in your name right now.",
    platformId: "soundexchange",
    actionLabel: "Claim royalties",
    category: "royalties",
  },
  {
    id: "the_mlc",
    label: "The MLC (mechanicals)",
    description: "The MLC holds unclaimed US mechanical royalties. Every unregistered ISRC is leaving money in a pool that eventually gets redistributed.",
    platformId: "mlc",
    actionLabel: "Register ISRCs",
    category: "royalties",
  },
  {
    id: "publishing_admin",
    label: "Publishing administration",
    description: "Without a publishing admin (Songtrust, CD Baby Pro), you can't collect mechanical or performance royalties in most international territories.",
    platformId: "songtrust",
    actionLabel: "Set up publishing",
    category: "royalties",
  },
  {
    id: "distribution_payout",
    label: "Distribution payout verified",
    description: "Your distributor must have a verified bank account on file or your earnings sit uncollected.",
    actionLabel: "Verify payout",
    category: "distribution",
  },
  {
    id: "spotify_verified",
    label: "Spotify for Artists verified",
    description: "Without verification you can't pitch music to editorial playlists — the single highest-ROI action for streams on release day.",
    platformId: "spotify",
    actionLabel: "Claim profile",
    category: "analytics",
  },
  {
    id: "apple_music_verified",
    label: "Apple Music for Artists",
    description: "Access to stream counts and Shazam data lets you verify your Apple royalty statements are paying correctly.",
    platformId: "apple_music",
    actionLabel: "Verify access",
    category: "analytics",
  },
  {
    id: "youtube_content_id",
    label: "YouTube Content ID",
    description: "Every fan video using your music without Content ID earns you $0. Enable it through your distributor — it's passive income.",
    platformId: "youtube",
    actionLabel: "Enable Content ID",
    category: "royalties",
  },
  {
    id: "split_sheets",
    label: "Split sheets signed",
    description: "Unsigned split sheets delay or block royalty payments. Every collaborator needs a documented, signed agreement.",
    actionLabel: "Review splits",
    category: "identity",
  },
];
