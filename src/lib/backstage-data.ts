export type TaskStatus = "To do" | "In progress" | "Waiting" | "Done";
export type TaskLane = "Create" | "Admin" | "Promo" | "Personal";
export type TaskEnergy = "Light" | "Medium" | "Heavy";

export type Task = {
  title: string;
  status: TaskStatus;
  lane: TaskLane;
  dueLabel: string;
  energy: TaskEnergy;
  blocked?: boolean;
  unblock?: string;
};

export type Project = {
  id: string;
  name: string;
  type: string;
  stage: string;
  daysLeft: number;
  goal: string;
  health: string;
  summary: string;
  managerNote: string;
  nextStep: string;
  priorities: string[];
  missingAssets: string[];
  assets: { name: string; type: string; status: string }[];
  contentIdeas: string[];
  outreach: { name: string; type: string; status: string }[];
  tasks: Task[];
};

export type ReadinessItem = {
  label: string;
  status: "Ready" | "Needs work";
  detail: string;
};

export type ReleaseMode = "Build" | "Pre-release" | "Release Week" | "Post-release" | "Recovery";

export type MoneyEntryType = "Income" | "Expense";

export type CreatorMoneyEntry = {
  id: string;
  type: MoneyEntryType;
  amount: number;
  source: string;
  category: string;
  note: string;
  date: string;
};

export type RevenueStreamStatus = "collecting" | "registered_not_collecting" | "not_registered" | "incomplete" | "unknown";

export type RevenueStreamType =
  | "streaming"
  | "digital_performance"
  | "performance_royalty"
  | "mechanical"
  | "neighboring_rights"
  | "youtube"
  | "sync";

export type RevenueStream = {
  streamType: RevenueStreamType;
  label: string;
  collectionBody: string;
  status: RevenueStreamStatus;
  actualAmount: number;
  estimatedGap: number;
  reason: string;
  action: string;
  rateNote: string;
};

export type SongCatalogItem = {
  id: string;
  title: string;
  isrc: string;
  releaseDate: string;
  streams: number;
  territory: string;
  collaborators: Array<{
    name: string;
    role: "writer" | "producer" | "featured_artist" | "master_owner";
    ownershipPercentage: number;
    signed: boolean;
  }>;
  distributionPlatforms: string[];
  metadataComplete: boolean;
  artworkUploaded: boolean;
  splitSheetSigned: boolean;
  revenueStreams: RevenueStream[];
};

export type PlatformConnectionStatus = "connected" | "not_connected" | "incomplete";
export type SubscriptionTier = "free" | "pro" | "elite";

export type PlatformConnection = {
  id: string;
  name: string;
  group: "Distributor" | "PRO" | "Digital Performance" | "Publishing" | "Content ID" | "Analytics";
  status: PlatformConnectionStatus;
  method: string;
  missingStep: string;
};

export type MiniPromoAsset = {
  title: string;
  format: string;
  status: "Ready to draft" | "Needs file" | "Needs review";
  copy: string;
  use: string;
  source: string;
};

export type CalmCreativePath = {
  headline: string;
  promise: string;
  bestShortcut: string;
  steps: Array<{
    label: string;
    action: string;
    detail: string;
    lane: TaskLane;
  }>;
};

export const projects: Project[] = [
  {
    id: "late-nights",
    name: "Late Nights",
    type: "Single",
    stage: "Pre-release",
    daysLeft: 12,
    goal: "Release on time with a clean rollout and stronger post consistency.",
    health: "Needs visuals",
    summary:
      "Dark late-night single with a tight campaign window. Strong song, but visuals and outreach timing still need structure.",
    managerNote:
      "You are close, but the release is not ready for full promo yet. Lock cover art, upload final master assets, then start playlist and creator outreach while there is still air in the timeline.",
    nextStep: "Approve final cover art so the whole release package can move without drag.",
    priorities: [
      "Approve final cover art",
      "Upload mastered WAV and clean version",
      "Generate teaser captions and short-form rollout",
    ],
    missingAssets: ["Final cover art", "15-second teaser clip", "Press photo select"],
    assets: [
      { name: "late-nights-master-v3.wav", type: "Audio", status: "Ready" },
      { name: "cover-draft-b.png", type: "Artwork", status: "Needs approval" },
      { name: "hook-teaser-notes.txt", type: "Notes", status: "Draft" },
    ],
    contentIdeas: [
      "Night-drive teaser with one-line caption",
      "Studio clip with producer insight",
      "Release-week carousel with lyric pull-quote",
    ],
    outreach: [
      { name: "Late Night Vibes Playlist", type: "Playlist", status: "Draft" },
      { name: "Indie R&B Curator", type: "Curator", status: "Not contacted" },
      { name: "College Radio Contact", type: "Radio", status: "Follow-up due" },
    ],
    tasks: [
      {
        title: "Finalize cover selection",
        status: "In progress",
        lane: "Create",
        dueLabel: "Today",
        energy: "Medium",
      },
      {
        title: "Upload final audio package",
        status: "To do",
        lane: "Admin",
        dueLabel: "Tomorrow",
        energy: "Light",
        blocked: true,
        unblock: "Needs final cover locked before distributor delivery package is complete.",
      },
      {
        title: "Send 5 curated outreach emails",
        status: "Waiting",
        lane: "Promo",
        dueLabel: "In 2 days",
        energy: "Medium",
        blocked: true,
        unblock: "Wait until visuals and teaser clip exist so the pitch feels complete.",
      },
      {
        title: "Record 15-second teaser clip",
        status: "To do",
        lane: "Create",
        dueLabel: "Today",
        energy: "Light",
      },
    ],
  },
  {
    id: "neon-heart",
    name: "Neon Heart",
    type: "Single",
    stage: "Rollout",
    daysLeft: 21,
    goal: "Build a 4-week content run that actually stays consistent.",
    health: "On track",
    summary: "A brighter record with good momentum, but content planning needs to be turned into scheduled actions.",
    managerNote:
      "This one has more breathing room. Focus on consistency: build the content stack now so release week does not become a scramble.",
    nextStep: "Turn content ideas into a dated weekly calendar before the momentum goes soft.",
    priorities: [
      "Build 4-week rollout calendar",
      "Draft three caption variations",
      "Create shortlist of outreach targets",
    ],
    missingAssets: ["Visualizer concept", "Behind-the-scenes footage"],
    assets: [
      { name: "neon-heart-master.wav", type: "Audio", status: "Ready" },
      { name: "neon-moodboard.pdf", type: "Moodboard", status: "Ready" },
    ],
    contentIdeas: [
      "Color-themed teaser sequence",
      "Story post countdown",
      "Post-release fan reaction prompt",
    ],
    outreach: [
      { name: "Alt Pop Blog", type: "Blog", status: "Draft" },
      { name: "TikTok creator shortlist", type: "Creator", status: "In progress" },
    ],
    tasks: [
      {
        title: "Build campaign calendar",
        status: "In progress",
        lane: "Admin",
        dueLabel: "This week",
        energy: "Medium",
      },
      {
        title: "Generate outreach drafts",
        status: "To do",
        lane: "Promo",
        dueLabel: "This week",
        energy: "Light",
      },
      {
        title: "Draft 3 caption options",
        status: "To do",
        lane: "Create",
        dueLabel: "Today",
        energy: "Light",
      },
      {
        title: "Schedule a personal reset block",
        status: "To do",
        lane: "Personal",
        dueLabel: "Tonight",
        energy: "Light",
      },
    ],
  },
];

export const seedProjects = projects;

export const seedMoneyEntries: CreatorMoneyEntry[] = [
  {
    id: "money-gig-1",
    type: "Income",
    amount: 450,
    source: "Gig",
    category: "Live",
    note: "Friday set deposit",
    date: new Date().toISOString(),
  },
  {
    id: "money-streaming-1",
    type: "Income",
    amount: 82,
    source: "Streaming",
    category: "Royalties",
    note: "Weekly platform estimate",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "money-studio-1",
    type: "Income",
    amount: 300,
    source: "Freelance",
    category: "Session",
    note: "Vocal mix balance",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "money-expense-1",
    type: "Expense",
    amount: 64,
    source: "Tools",
    category: "Subscription",
    note: "Creative software",
    date: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const seedSongs: SongCatalogItem[] = [
  {
    id: "late-nights",
    title: "Late Nights",
    isrc: "QZPMB2400011",
    releaseDate: "2026-05-03",
    streams: 340000,
    territory: "United States",
    collaborators: [
      { name: "Badman", role: "master_owner", ownershipPercentage: 60, signed: true },
      { name: "Milo Keys", role: "producer", ownershipPercentage: 25, signed: false },
      { name: "J. Night", role: "writer", ownershipPercentage: 15, signed: true },
    ],
    distributionPlatforms: ["DistroKid", "Spotify", "Apple Music"],
    metadataComplete: true,
    artworkUploaded: false,
    splitSheetSigned: false,
    revenueStreams: [
      {
        streamType: "streaming",
        label: "Streaming royalties",
        collectionBody: "DistroKid",
        status: "collecting",
        actualAmount: 120,
        estimatedGap: 0,
        reason: "Distributor collection is active.",
        action: "Review distributor statement",
        rateNote: "Confirmed collected amount from distributor statement.",
      },
      {
        streamType: "digital_performance",
        label: "Digital performance royalties",
        collectionBody: "SoundExchange",
        status: "not_registered",
        actualAmount: 0,
        estimatedGap: 68,
        reason: "Not registered on SoundExchange.",
        action: "Register now",
        rateNote: "Conservative estimate from non-interactive digital performance collection path.",
      },
      {
        streamType: "performance_royalty",
        label: "Performance royalties (writer)",
        collectionBody: "BMI",
        status: "not_registered",
        actualAmount: 0,
        estimatedGap: 42,
        reason: "Song not logged with PRO.",
        action: "Add to BMI repertoire",
        rateNote: "Conservative estimate based on public performance collection opportunity.",
      },
      {
        streamType: "mechanical",
        label: "Mechanical royalties",
        collectionBody: "The MLC",
        status: "incomplete",
        actualAmount: 0,
        estimatedGap: 31,
        reason: "Mechanical royalty path is not fully connected.",
        action: "Connect MLC path",
        rateNote: "Rounded down estimate for digital mechanical collection.",
      },
      {
        streamType: "youtube",
        label: "YouTube Content ID",
        collectionBody: "YouTube",
        status: "not_registered",
        actualAmount: 0,
        estimatedGap: 24,
        reason: "Master is not claimed for Content ID.",
        action: "Claim Content ID",
        rateNote: "Low conservative estimate for user-generated video usage risk.",
      },
    ],
  },
  {
    id: "neon-heart",
    title: "Neon Heart",
    isrc: "QZPMB2400012",
    releaseDate: "2026-05-24",
    streams: 126000,
    territory: "United States",
    collaborators: [
      { name: "Badman", role: "master_owner", ownershipPercentage: 70, signed: true },
      { name: "Wave Lab", role: "producer", ownershipPercentage: 30, signed: true },
    ],
    distributionPlatforms: ["TuneCore", "Spotify"],
    metadataComplete: false,
    artworkUploaded: true,
    splitSheetSigned: true,
    revenueStreams: [
      {
        streamType: "streaming",
        label: "Streaming royalties",
        collectionBody: "TuneCore",
        status: "collecting",
        actualAmount: 54,
        estimatedGap: 0,
        reason: "Distributor collection is active.",
        action: "Review distributor statement",
        rateNote: "Confirmed collected amount from distributor statement.",
      },
      {
        streamType: "digital_performance",
        label: "Digital performance royalties",
        collectionBody: "SoundExchange",
        status: "not_registered",
        actualAmount: 0,
        estimatedGap: 26,
        reason: "Not registered on SoundExchange.",
        action: "Register now",
        rateNote: "Conservative estimate from non-interactive digital performance collection path.",
      },
      {
        streamType: "performance_royalty",
        label: "Performance royalties (writer)",
        collectionBody: "ASCAP",
        status: "registered_not_collecting",
        actualAmount: 0,
        estimatedGap: 12,
        reason: "Registration exists, but metadata is incomplete.",
        action: "Complete metadata",
        rateNote: "Rounded down estimate because registration exists but is blocked by metadata.",
      },
    ],
  },
];

export const seedPlatformConnections: PlatformConnection[] = [
  { id: "distrokid", name: "DistroKid", group: "Distributor", status: "connected", method: "OAuth or statement import", missingStep: "Connected" },
  { id: "tunecore", name: "TuneCore", group: "Distributor", status: "incomplete", method: "OAuth or manual", missingStep: "Upload latest statement" },
  { id: "cdbaby", name: "CD Baby", group: "Distributor", status: "not_connected", method: "OAuth or manual", missingStep: "Connect account" },
  { id: "ascap", name: "ASCAP", group: "PRO", status: "incomplete", method: "Manual verification + ISRC lookup", missingStep: "Verify repertoire" },
  { id: "bmi", name: "BMI", group: "PRO", status: "not_connected", method: "Manual verification + ISRC lookup", missingStep: "Register works" },
  { id: "sesac", name: "SESAC", group: "PRO", status: "not_connected", method: "Manual verification", missingStep: "Verify affiliation" },
  { id: "soundexchange", name: "SoundExchange", group: "Digital Performance", status: "not_connected", method: "Manual verification + ISRC lookup", missingStep: "Register recordings" },
  { id: "mlc", name: "The MLC", group: "Publishing", status: "not_connected", method: "Manual verification", missingStep: "Connect mechanical path" },
  { id: "youtube", name: "YouTube", group: "Content ID", status: "not_connected", method: "OAuth", missingStep: "Claim master recordings" },
  { id: "spotify", name: "Spotify for Artists", group: "Analytics", status: "connected", method: "OAuth", missingStep: "Connected" },
];

export const onboardingSteps = [
  "Who are you? artist / producer / engineer / DJ / songwriter",
  "What are you releasing or building right now?",
  "What is the target release date or timeframe?",
  "What matters most: release on time, stay organized, content consistency, outreach, or all of it?",
];

export const onboardingProfiles = [
  {
    title: "Independent artist",
    copy: "Needs one place for releases, captions, priorities, and outreach without juggling five apps.",
  },
  {
    title: "Producer / songwriter",
    copy: "Needs a fast way to organize beats, song starts, references, splits, and collaborator follow-ups.",
  },
  {
    title: "Engineer / DJ",
    copy: "Needs clean control over mix notes, set assets, client files, promo pieces, and delivery status.",
  },
  {
    title: "Creative operator",
    copy: "Needs calm next steps, decision support, and a system that keeps entertainment work moving.",
  },
] as const;

export const onboardingGoals = [
  "Release on time",
  "Stay organized daily",
  "Build a stronger rollout",
  "Keep all assets in one vault",
  "Get clearer manager-style direction",
] as const;

export const projectTemplates = [
  {
    title: "Single rollout",
    focus: "Get one record fully packaged and pushed without unnecessary drag.",
    bestFor: "Tight single release windows with a clear first impression.",
  },
  {
    title: "EP campaign",
    focus: "Turn a multi-track release into one coherent rollout system.",
    bestFor: "Artists building a broader story and staggered content arc.",
  },
  {
    title: "Playlist push",
    focus: "Prepare the pitch package, outreach stack, and follow-up timing cleanly.",
    bestFor: "Records that need curator, playlist, and tastemaker attention fast.",
  },
  {
    title: "Visual-heavy drop",
    focus: "Center the release around strong imagery, clips, and aesthetic cohesion.",
    bestFor: "Songs where visuals carry a major part of the momentum.",
  },
  {
    title: "Session / beat pack",
    focus: "Organize rough bounces, references, collaborators, notes, and small promo moves around one creative batch.",
    bestFor: "Songwriters, producers, and studio collaborators turning raw work into usable assets.",
  },
  {
    title: "Mix / master delivery",
    focus: "Track versions, client notes, approvals, delivery files, and simple share-ready updates.",
    bestFor: "Audio engineers and producers managing a clean handoff without losing context.",
  },
  {
    title: "DJ set / event push",
    focus: "Package a set, flyer copy, music links, clips, guest tags, and follow-up reminders in one room.",
    bestFor: "DJs and live creatives promoting a set, event, or recorded mix.",
  },
  {
    title: "Low-budget release",
    focus: "Strip the plan down to the highest-leverage free and cheap moves.",
    bestFor: "Creatives under real budget pressure who still need the work to land.",
  },
] as const;

export const starterWorkspaceOutputs = [
  "Starter checklist based on release stage and timeline",
  "First manager note built from your current pressure points",
  "Project room with tasks, assets, and outreach stack ready to fill",
] as const;

export const roomTemplatePreviews = [
  {
    title: "Release readiness",
    detail: "Creation should immediately score the room and show what is weak, missing, and safe to move.",
  },
  {
    title: "Content flow",
    detail: "The room should open with ideas, asset dependencies, and the first scheduling beats already framed.",
  },
  {
    title: "Pitch lane",
    detail: "Playlist and outreach motion should appear as a structured lane, not something the user has to invent from scratch.",
  },
] as const;

export const quickActions = [
  ["/projects/new", "Create creative room"],
  ["/manager", "Ask AI manager"],
  ["/projects/late-nights", "Open active project"],
  ["/settings", "Set your personal operating mode"],
];

export const personalSystem = {
  title: "Personal reset",
  description: "Use Pocket Manager like a real daily support tool, not just a release tracker.",
  wins: [
    "See what matters today without digging through notes",
    "Turn stress into a short next-action list",
    "Keep releases, ideas, and personal momentum in one place",
  ],
  checkIn: [
    "What must get done today?",
    "What is blocking your energy or focus?",
    "What can be delegated, automated, or postponed?",
  ],
};

export const artistDefaults = [
  {
    title: "Artist identity",
    detail: "Independent artist, dark cinematic lane, release-focused workflow.",
  },
  {
    title: "Planning bias",
    detail: "Prefer a short next-action list over long productivity systems.",
  },
  {
    title: "Budget posture",
    detail: "Lean budget, selective spend, strongest push around visuals and rollout assets.",
  },
] as const;

export const managerBehaviorModes = [
  {
    title: "Calm mode",
    detail: "Reduce noise, narrow the list, and protect momentum when energy is low.",
  },
  {
    title: "Direct mode",
    detail: "Say what is blocked, what matters, and what has to move next.",
  },
  {
    title: "Push mode",
    detail: "Treat release windows like pressure periods and keep urgency visible.",
  },
] as const;

export const pocketSystemRules = [
  "Pocket Manager should feel like a fast operator tool, not a bloated dashboard.",
  "The app should surface the top priorities before anything else.",
  "Capture, tasks, assets, and manager guidance should stay within one mobile flow.",
  "The system should preserve continuity after release day instead of going quiet too early.",
] as const;

export const pocketMoatLayers = [
  "Taste engine",
  "Career memory",
  "Decision engine",
  "Revenue brain",
  "Song-to-world engine",
  "Studio-to-release pipeline",
  "Audience ownership layer",
  "Emergency mode",
] as const;

export const companionSystemRules = [
  "Let identity, voice, and behavior mix freely without stereotype-locking.",
  "Keep companion customization premium and respectful, never novelty-first.",
  "The companion should feel like a trusted manager friend, not a cartoon assistant.",
] as const;

export const personalCompanionProfiles = [
  {
    title: "Studio friend",
    detail: "Keeps things calm, remembers loose ideas, and turns scattered notes into the next clean move.",
  },
  {
    title: "Direct operator",
    detail: "Cuts through noise, tells the truth, and keeps pressure visible when timing matters.",
  },
  {
    title: "Campaign runner",
    detail: "Carries rollout, outreach, and follow-up energy so the project does not go soft.",
  },
] as const;

export function getProjectById(projectId: string, sourceProjects: Project[] = projects) {
  return sourceProjects.find((project) => project.id === projectId);
}

export function getOpenTaskCount(project: Project) {
  return project.tasks.filter((task) => task.status !== "Done").length;
}

export function getBlockedTaskCount(project: Project) {
  return project.tasks.filter((task) => task.blocked).length;
}

export function getManagerSnapshot(sourceProjects: Project[] = projects) {
  const openTasks = sourceProjects.reduce((total, project) => total + getOpenTaskCount(project), 0);
  const blockedTasks = sourceProjects.reduce((total, project) => total + getBlockedTaskCount(project), 0);
  const dueToday = sourceProjects.reduce(
    (total, project) => total + project.tasks.filter((task) => task.dueLabel === "Today").length,
    0,
  );

  return {
    activeProjects: sourceProjects.length,
    openTasks,
    blockedTasks,
    dueToday,
  };
}

export function getCreatorMoneySummary(entries: CreatorMoneyEntry[]) {
  const now = new Date();
  const todayKey = toDateKey(now);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentWeekStart = startOfWeek(now).getTime();
  const lastWeekStart = currentWeekStart - 7 * 86400000;
  const currentWeekEnd = currentWeekStart + 7 * 86400000;

  const income = entries.filter((entry) => entry.type === "Income");
  const expenses = entries.filter((entry) => entry.type === "Expense");
  const todayIncome = sumMoney(income.filter((entry) => toDateKey(new Date(entry.date)) === todayKey));
  const weekIncome = sumMoney(income.filter((entry) => isBetween(new Date(entry.date).getTime(), currentWeekStart, currentWeekEnd)));
  const lastWeekIncome = sumMoney(income.filter((entry) => isBetween(new Date(entry.date).getTime(), lastWeekStart, currentWeekStart)));
  const monthIncome = sumMoney(income.filter((entry) => entry.date.startsWith(monthKey)));
  const weekExpenses = sumMoney(expenses.filter((entry) => isBetween(new Date(entry.date).getTime(), currentWeekStart, currentWeekEnd)));
  const recent = [...entries].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()).slice(0, 4);
  const netThisWeek = weekIncome - weekExpenses;
  const trendDelta = weekIncome - lastWeekIncome;

  return {
    todayIncome,
    weekIncome,
    monthIncome,
    weekExpenses,
    netThisWeek,
    trendLabel:
      lastWeekIncome === 0
        ? "New income week"
        : trendDelta >= 0
          ? `Up ${formatMoney(trendDelta)} vs last week`
          : `Down ${formatMoney(Math.abs(trendDelta))} vs last week`,
    recent,
  };
}

export function getCreatorMoneyInsight(entries: CreatorMoneyEntry[]) {
  const summary = getCreatorMoneySummary(entries);
  const strongestIncome = entries
    .filter((entry) => entry.type === "Income")
    .sort((left, right) => right.amount - left.amount)[0];
  const largestExpense = entries
    .filter((entry) => entry.type === "Expense")
    .sort((left, right) => right.amount - left.amount)[0];

  if (summary.weekExpenses > summary.weekIncome * 0.5 && summary.weekIncome > 0) {
    return `Spending is taking a lot of this week's income. Check ${largestExpense?.source ?? "the biggest expense"} before adding new costs.`;
  }

  if (strongestIncome) {
    return `${strongestIncome.source} is the strongest money signal right now. Follow up while the momentum is warm.`;
  }

  return "Log one income or expense today so Pocket can start giving money guidance.";
}

export function getRevenueGapSummary(songs: SongCatalogItem[] = seedSongs) {
  const totalSecured = songs.reduce(
    (total, song) => total + song.revenueStreams.reduce((songTotal, stream) => songTotal + stream.actualAmount, 0),
    0,
  );
  const totalEstimatedGap = songs.reduce(
    (total, song) => total + song.revenueStreams.reduce((songTotal, stream) => songTotal + stream.estimatedGap, 0),
    0,
  );
  const songsWithGaps = songs.filter((song) => getSongEstimatedGap(song) > 0).length;
  const activeIncomeStreams = songs.flatMap((song) => song.revenueStreams).filter((stream) => stream.status === "collecting").length;

  return {
    totalSecured,
    totalEstimatedGap,
    songsWithGaps,
    activeIncomeStreams,
    totalSongs: songs.length,
  };
}

export function getSongEstimatedGap(song: SongCatalogItem) {
  return song.revenueStreams.reduce((total, stream) => total + stream.estimatedGap, 0);
}

export function getSongConfirmedIncome(song: SongCatalogItem) {
  return song.revenueStreams.reduce((total, stream) => total + stream.actualAmount, 0);
}

export function getSongGapScore(song: SongCatalogItem) {
  const gap = getSongEstimatedGap(song);
  const secured = getSongConfirmedIncome(song);
  const potential = secured + gap;

  if (!potential) {
    return 100;
  }

  return Math.round((gap / potential) * 100);
}

export function getSongReadinessScore(song: SongCatalogItem) {
  const hasDistributor = song.revenueStreams.some((stream) => stream.streamType === "streaming" && stream.status === "collecting");
  const hasPro = song.revenueStreams.some(
    (stream) => stream.streamType === "performance_royalty" && stream.status !== "not_registered" && stream.status !== "unknown",
  );
  const hasSoundExchange = song.revenueStreams.some(
    (stream) => stream.streamType === "digital_performance" && stream.status !== "not_registered" && stream.status !== "unknown",
  );
  const hasContentId = song.revenueStreams.some(
    (stream) => stream.streamType === "youtube" && stream.status !== "not_registered" && stream.status !== "unknown",
  );

  return (
    (song.isrc ? 10 : 0) +
    (song.metadataComplete ? 15 : 0) +
    (song.artworkUploaded ? 10 : 0) +
    (hasDistributor ? 15 : 0) +
    (hasPro ? 15 : 0) +
    (hasSoundExchange ? 15 : 0) +
    (hasContentId ? 10 : 0) +
    (song.splitSheetSigned ? 10 : 0)
  );
}

export function getSongReadinessChecklist(song: SongCatalogItem) {
  const hasDistributor = song.revenueStreams.some((stream) => stream.streamType === "streaming" && stream.status === "collecting");
  const hasPro = song.revenueStreams.some(
    (stream) => stream.streamType === "performance_royalty" && stream.status !== "not_registered" && stream.status !== "unknown",
  );
  const hasSoundExchange = song.revenueStreams.some(
    (stream) => stream.streamType === "digital_performance" && stream.status !== "not_registered" && stream.status !== "unknown",
  );
  const hasContentId = song.revenueStreams.some(
    (stream) => stream.streamType === "youtube" && stream.status !== "not_registered" && stream.status !== "unknown",
  );

  return [
    {
      label: "ISRC assigned",
      points: 10,
      done: Boolean(song.isrc),
      action: "Add ISRC",
      href: "/projects/new",
    },
    {
      label: "Metadata complete",
      points: 15,
      done: song.metadataComplete,
      action: "Complete metadata",
      href: `/projects/${song.id}`,
    },
    {
      label: "Artwork uploaded",
      points: 10,
      done: song.artworkUploaded,
      action: "Add artwork",
      href: `/projects/${song.id}`,
    },
    {
      label: "Distributed to DSPs",
      points: 15,
      done: hasDistributor,
      action: "Connect distributor",
      href: "/platforms",
    },
    {
      label: "PRO registration complete",
      points: 15,
      done: hasPro,
      action: "Fix PRO",
      href: "/platforms",
    },
    {
      label: "SoundExchange registered",
      points: 15,
      done: hasSoundExchange,
      action: "Fix SoundExchange",
      href: "/platforms",
    },
    {
      label: "YouTube Content ID active",
      points: 10,
      done: hasContentId,
      action: "Claim Content ID",
      href: "/platforms",
    },
    {
      label: "Split sheet signed",
      points: 10,
      done: song.splitSheetSigned,
      action: "Send split",
      href: `/projects/${song.id}`,
    },
  ];
}

export function getNextRevenueAction(songs: SongCatalogItem[] = seedSongs) {
  const top = getRevenueActionQueue(songs)[0];

  if (!top) {
    return {
      title: "All detected revenue paths are covered",
      estimatedValue: 0,
      estimatedTime: "Review",
      songId: songs[0]?.id ?? "late-nights",
      songTitle: songs[0]?.title ?? "Catalog",
      streamType: "streaming",
      collectionBody: "Catalog",
      action: "Review catalog",
    };
  }

  return {
    title: top.title,
    estimatedValue: top.estimatedValue,
    estimatedTime: top.estimatedTime,
    songId: top.songId,
    songTitle: top.songTitle,
    streamType: top.streamType,
    collectionBody: top.collectionBody,
    action: top.action,
  };
}

export function getRevenueActionQueue(songs: SongCatalogItem[] = seedSongs) {
  return songs
    .flatMap((song) =>
      song.revenueStreams
        .filter((stream) => stream.estimatedGap > 0 || stream.status === "not_registered" || stream.status === "incomplete")
        .map((stream) => ({
          id: `${song.id}-${stream.streamType}-${stream.collectionBody}`,
          title: `${stream.action} for "${song.title}"`,
          action: stream.action,
          songId: song.id,
          songTitle: song.title,
          streamType: stream.streamType,
          collectionBody: stream.collectionBody,
          estimatedValue: stream.estimatedGap,
          estimatedTime: stream.streamType === "digital_performance" ? "~5 minutes" : "~8 minutes",
          priority: getRevenueStreamPriority(stream.streamType) + stream.estimatedGap,
          reason: stream.reason,
        })),
    )
    .sort((left, right) => right.priority - left.priority);
}

function getRevenueStreamPriority(streamType: RevenueStreamType) {
  const priority: Record<RevenueStreamType, number> = {
    digital_performance: 1000,
    performance_royalty: 900,
    streaming: 850,
    youtube: 700,
    neighboring_rights: 650,
    mechanical: 600,
    sync: 500,
  };

  return priority[streamType];
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatGapEstimate(amount: number, tier: SubscriptionTier = "free") {
  if (tier !== "free") {
    return `${formatMoney(amount)} estimated`;
  }

  if (amount <= 0) {
    return "$0 estimated";
  }

  const roundedRange = Math.max(50, Math.floor(amount / 50) * 50);
  return `~${formatMoney(roundedRange)}+ estimated`;
}

function sumMoney(entries: CreatorMoneyEntry[]) {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isBetween(value: number, start: number, end: number) {
  return value >= start && value < end;
}

export function getTodayQueue(sourceProjects: Project[] = projects) {
  return sourceProjects
    .flatMap((project) =>
      project.tasks
        .filter((task) => task.status !== "Done")
        .map((task) => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectStage: project.stage,
          daysLeft: project.daysLeft,
        })),
    )
    .sort((left, right) => {
      const leftScore = getTaskPriorityScore(left.dueLabel, left.blocked, left.daysLeft, left.status);
      const rightScore = getTaskPriorityScore(right.dueLabel, right.blocked, right.daysLeft, right.status);

      return rightScore - leftScore;
    });
}

function getTaskPriorityScore(
  dueLabel: string,
  blocked: boolean | undefined,
  daysLeft: number,
  status: TaskStatus,
) {
  const dueScoreMap: Record<string, number> = {
    Today: 5,
    Tonight: 4,
    Tomorrow: 3,
    "In 2 days": 2,
    "This week": 1,
  };

  return (dueScoreMap[dueLabel] ?? 0) + (blocked ? 2 : 0) + (status === "In progress" ? 2 : 0) + (14 - Math.min(daysLeft, 14));
}

export function getTaskLaneSummary(sourceProjects: Project[] = projects) {
  const summary: Record<TaskLane, number> = {
    Create: 0,
    Admin: 0,
    Promo: 0,
    Personal: 0,
  };

  for (const task of getTodayQueue(sourceProjects)) {
    summary[task.lane] += 1;
  }

  return summary;
}

export function getDailyFocusCards(sourceProjects: Project[] = projects) {
  return sourceProjects.map((project) => ({
    id: project.id,
    name: project.name,
    nextStep: project.nextStep,
    pressure:
      project.daysLeft <= 14 ? "High pressure" : project.daysLeft <= 21 ? "Steady push" : "Build runway",
    missing: project.missingAssets[0] ?? "No missing assets listed",
  }));
}

export function getReleaseMode(project: Project): ReleaseMode {
  if (project.daysLeft <= 7) {
    return "Release Week";
  }

  if (project.stage === "Rollout") {
    return "Pre-release";
  }

  if (project.daysLeft <= 21) {
    return "Pre-release";
  }

  return "Build";
}

export function getPressureMeter(project: Project) {
  const blockedTasks = getBlockedTaskCount(project);

  if (project.daysLeft <= 7 || blockedTasks >= 2) {
    return "Critical";
  }

  if (project.daysLeft <= 14 || blockedTasks >= 1) {
    return "Tight";
  }

  if (project.daysLeft <= 21) {
    return "Manageable";
  }

  return "Low pressure";
}

export function getMomentumScore(project: Project) {
  const inProgress = project.tasks.filter((task) => task.status === "In progress").length;
  const readyAssets = project.assets.filter((asset) => asset.status === "Ready").length;
  const activeOutreach = project.outreach.filter((item) => item.status !== "Not contacted").length;

  return Math.min(100, inProgress * 20 + readyAssets * 15 + activeOutreach * 12 + Math.max(0, 25 - project.daysLeft));
}

export function getCaptureInboxPreview(sourceProjects: Project[] = projects) {
  return [
    {
      title: "Quick task",
      project: sourceProjects[0]?.name ?? "Active project",
      copy: `Lock "${sourceProjects[0]?.missingAssets[0] ?? "the next blocker"}" before the rollout slows down.`,
    },
    {
      title: "Voice note",
      project: sourceProjects[1]?.name ?? "Second project",
      copy: `Pocket in a short content angle for ${sourceProjects[1]?.name ?? "the next release"} while it is still fresh.`,
    },
    {
      title: "Add asset",
      project: sourceProjects[0]?.name ?? "Active project",
      copy: "Throw cover drafts, teaser clips, and notes into the room before they vanish into messages.",
    },
  ] as const;
}

export function getRecentActivity(sourceProjects: Project[] = projects) {
  return sourceProjects
    .flatMap((project) => {
      const recentAssets = project.assets.slice(0, 2).map((asset, index) => ({
        id: `${project.id}-asset-${index}-${asset.name}`,
        projectId: project.id,
        projectName: project.name,
        title: asset.name,
        kind: "Vault",
        detail: `${asset.type} saved with ${asset.status.toLowerCase()} status.`,
        emphasis: asset.status === "Uploaded" || asset.status === "Captured" ? "New file" : "Asset state",
      }));

      const recentTasks = project.tasks.slice(0, 2).map((task, index) => ({
        id: `${project.id}-task-${index}-${task.title}`,
        projectId: project.id,
        projectName: project.name,
        title: task.title,
        kind: "Task",
        detail: `${task.lane} lane · ${task.status} · ${task.dueLabel}.`,
        emphasis: task.status === "In progress" ? "Moving" : task.status,
      }));

      const recentOutreach = project.outreach.slice(0, 1).map((item, index) => ({
        id: `${project.id}-outreach-${index}-${item.name}`,
        projectId: project.id,
        projectName: project.name,
        title: item.name,
        kind: "Outreach",
        detail: `${item.type} contact is ${item.status.toLowerCase()}.`,
        emphasis: item.status,
      }));

      return [...recentAssets, ...recentTasks, ...recentOutreach];
    })
    .sort((left, right) => {
      const score = (item: { kind: string; emphasis: string }) => {
        if (item.kind === "Vault" && item.emphasis === "New file") return 5;
        if (item.kind === "Task" && item.emphasis === "Moving") return 4;
        if (item.kind === "Outreach" && item.emphasis === "Sent") return 3;
        return 2;
      };

      return score(right) - score(left);
    })
    .slice(0, 8);
}

export function getProjectTimeline(project: Project) {
  return [
    {
      label: "Now",
      title: project.nextStep,
      tone: "strong",
    },
    {
      label: "Before release pressure",
      title: project.missingAssets[0] ? `Remove blocker: ${project.missingAssets[0]}` : "Tighten the release package",
      tone: "warning",
    },
    {
      label: "Then",
      title: `Convert ${project.contentIdeas[0].toLowerCase()} into a scheduled post`,
      tone: "calm",
    },
  ] as const;
}

export function getReleaseReadiness(project: Project) {
  const readiness: ReadinessItem[] = [
    {
      label: "Audio package",
      status: project.assets.some((asset) => asset.type === "Audio" && asset.status === "Ready") ? "Ready" : "Needs work",
      detail: project.assets.some((asset) => asset.type === "Audio" && asset.status === "Ready")
        ? "Primary audio file is already in the room."
        : "Final audio still needs to land in the room.",
    },
    {
      label: "Visual package",
      status: project.missingAssets.some((asset) => asset.toLowerCase().includes("cover")) ? "Needs work" : "Ready",
      detail: project.missingAssets.some((asset) => asset.toLowerCase().includes("cover"))
        ? "Visual approval is still blocking the release package."
        : "Cover and visual direction are present enough to move.",
    },
    {
      label: "Promo runway",
      status: project.outreach.some((contact) => contact.status === "Draft" || contact.status === "In progress")
        ? "Ready"
        : "Needs work",
      detail: project.outreach.some((contact) => contact.status === "Draft" || contact.status === "In progress")
        ? "Outreach is at least staged and ready to sharpen."
        : "There is no real outreach motion yet.",
    },
    {
      label: "Execution focus",
      status: project.tasks.some((task) => task.status === "In progress") ? "Ready" : "Needs work",
      detail: project.tasks.some((task) => task.status === "In progress")
        ? "There is active movement in the room right now."
        : "The room needs one clear task pushed into motion.",
    },
  ];

  const readyCount = readiness.filter((item) => item.status === "Ready").length;
  const pressure = getPressureMeter(project);

  return {
    score: Math.round((readyCount / readiness.length) * 100),
    state:
      readyCount >= 4
        ? "Ready"
        : pressure === "Critical"
          ? "Risky"
          : blockedState(project),
    items: readiness,
  };
}

function blockedState(project: Project) {
  if (project.missingAssets.some((asset) => asset.toLowerCase().includes("cover") || asset.toLowerCase().includes("visual"))) {
    return "Blocked by visuals";
  }

  if (project.outreach.every((item) => item.status === "Not contacted")) {
    return "Outreach weak";
  }

  return "Not ready";
}

export function getProjectSprint(project: Project) {
  const topTask = project.tasks.find((task) => task.status === "In progress") ?? project.tasks[0];
  const unblocker = project.tasks.find((task) => task.blocked && task.unblock);

  return [
    {
      label: "Lock today",
      title: topTask?.title ?? project.nextStep,
      detail: `Push the ${topTask?.lane.toLowerCase() ?? "main"} lane before context gets noisy.`,
    },
    {
      label: "Remove drag",
      title: unblocker?.title ?? `Solve ${project.missingAssets[0] ?? "the next missing asset"}`,
      detail: unblocker?.unblock ?? "Clear the blocker that is keeping the release package half-finished.",
    },
    {
      label: "Create motion",
      title: project.contentIdeas[0] ?? "Turn one idea into a post",
      detail: "Convert one concept into a shipped content or outreach asset this week.",
    },
  ] as const;
}

export function getManagerBrief(project: Project) {
  const readiness = getReleaseReadiness(project);
  const blockedTask = project.tasks.find((task) => task.blocked);
  const pressure = getPressureMeter(project);
  const momentum = getMomentumScore(project);
  const mode = getReleaseMode(project);

  return {
    urgency:
      project.daysLeft <= 14 ? "Tight window" : project.daysLeft <= 21 ? "Active runway" : "Build phase",
    mode,
    pressure,
    momentum,
    readinessScore: readiness.score,
    mainRisk: blockedTask?.unblock ?? `Missing ${project.missingAssets[0] ?? "assets"} is slowing the room down.`,
    bestMove: project.nextStep,
    supportPrompt: `Turn ${project.name} into a 7-day plan that clears blockers and ships one promo asset.`,
  };
}

export function getPocketSystemSnapshot(sourceProjects: Project[] = projects) {
  const readinessScores = sourceProjects.map((project) => getReleaseReadiness(project).score);
  const averageReadiness =
    readinessScores.length > 0
      ? Math.round(readinessScores.reduce((total, score) => total + score, 0) / readinessScores.length)
      : 0;

  return {
    averageReadiness,
    activeProjects: sourceProjects.length,
    blockedProjects: sourceProjects.filter((project) => getBlockedTaskCount(project) > 0).length,
    urgentProjects: sourceProjects.filter((project) => project.daysLeft <= 14).length,
  };
}

export function getCrossSurfaceSignals(sourceProjects: Project[] = projects) {
  return sourceProjects.map((project) => {
    const readiness = getReleaseReadiness(project);
    const inProgress = project.tasks.filter((task) => task.status === "In progress").length;

    return {
      id: project.id,
      name: project.name,
      readiness: readiness.score,
      lane: inProgress > 0 ? "Execution moving" : "Needs activation",
      missionView:
        project.daysLeft <= 14
          ? "Mission Control should keep this room high in the stack."
          : "Mission Control should track this room as a steady build lane.",
    };
  });
}

export function getRoomStateBoard(sourceProjects: Project[] = projects) {
  return sourceProjects.map((project) => {
    const readiness = getReleaseReadiness(project);
    const pressure = getPressureMeter(project);
    const blocked = getBlockedTaskCount(project);

    return {
      id: project.id,
      name: project.name,
      state: readiness.state,
      readiness: readiness.score,
      pressure,
      continuity:
        project.daysLeft <= 7
          ? "Prepare post-release follow-up before the launch window passes."
          : "Build the room so follow-through is easy later, not only launch-day loud.",
      nextMove: project.nextStep,
      blocked,
    };
  });
}

export function getPostReleaseMode(project: Project) {
  return [
    {
      title: "Follow-up content",
      detail: `Keep ${project.name} alive with reaction posts, late-angle clips, and softer second-wave moments.`,
    },
    {
      title: "Outreach follow-through",
      detail: "Use the release window to send follow-ups, update contacts, and catch late interest while the record is still warm.",
    },
    {
      title: "Archive continuity",
      detail: "Save what was used, what landed, and what should carry into the next release instead of losing the memory.",
    },
  ] as const;
}

export function getActiveRoomSummary(project: Project) {
  const readiness = getReleaseReadiness(project);
  const pressure = getPressureMeter(project);
  const blocked = getBlockedTaskCount(project);

  return {
    id: project.id,
    name: project.name,
    state: readiness.state,
    readiness: readiness.score,
    pressure,
    blocked,
    nextMove: project.nextStep,
  };
}

export function getProjectCreationBlueprint() {
  return [
    {
      stage: "Pre-release",
      focus: "Lock the core package before promo starts.",
      checklist: ["Confirm master and clean version", "Approve cover direction", "Set release date and first rollout beat"],
    },
    {
      stage: "Rollout",
      focus: "Turn the campaign into dated moves and visible assets.",
      checklist: ["Build weekly content run", "Prepare outreach list", "Track missing visuals and captions"],
    },
    {
      stage: "Live",
      focus: "Keep outputs, fan touchpoints, and follow-ups organized.",
      checklist: ["Capture performance media", "Log follow-ups and contacts", "Queue next content moments"],
    },
  ] as const;
}

export function getPocketOperatingStates() {
  return [
    {
      title: "Fast capture",
      detail: "One thumb gets you into quick task, voice note, or asset drop without extra navigation.",
    },
    {
      title: "Decision support",
      detail: "Pocket should surface the next release move, biggest risk, and best support prompt at a glance.",
    },
    {
      title: "Room control",
      detail: "Every project room should expose readiness, checklist, outreach, and the next seven-day push.",
    },
  ] as const;
}

export function getProjectExecutionChecklist(project: Project) {
  return project.tasks.slice(0, 4).map((task, index) => ({
    step: index + 1,
    title: task.title,
    owner: task.lane,
    status: task.status,
    note: task.blocked ? task.unblock ?? "Needs an unblock move." : `${task.dueLabel} · ${task.energy} energy`,
  }));
}

export function getProjectDecisionBoard(project: Project) {
  const firstMissingAsset = project.missingAssets[0];
  const blockedTask = project.tasks.find((task) => task.blocked);

  return [
    {
      title: "What needs a decision first",
      detail: firstMissingAsset
        ? `Decide how to finish ${firstMissingAsset.toLowerCase()} so the room can move cleanly.`
        : "Decide which task gets the strongest push this week.",
    },
    {
      title: "What can move without waiting",
      detail: project.tasks.find((task) => !task.blocked)?.title ?? "Turn one content idea into a concrete task.",
    },
    {
      title: "What will stall the room",
      detail: blockedTask?.unblock ?? "Lack of consistent outreach and visual follow-through will slow momentum.",
    },
  ] as const;
}

export function getProjectTriageBoard(sourceProjects: Project[] = projects) {
  return sourceProjects.map((project) => {
    const readiness = getReleaseReadiness(project);
    const blockedTasks = getBlockedTaskCount(project);
    const nextDueTask = project.tasks.find((task) => task.status !== "Done");

    return {
      id: project.id,
      name: project.name,
      readiness: readiness.score,
      pressure: getPressureMeter(project),
      mode: getReleaseMode(project),
      momentum: getMomentumScore(project),
      blockerCount: blockedTasks,
      nextMove: nextDueTask?.title ?? project.nextStep,
    };
  });
}

export function getAutopilotRecommendations(project: Project) {
  const blockedTask = project.tasks.find((task) => task.blocked);
  const nextTask = project.tasks.find((task) => task.status !== "Done");
  const followUp = project.outreach.find((item) => item.status === "Follow-up due");
  const draftOutreach = project.outreach.find((item) => item.status === "Draft" || item.status === "Not contacted");
  const missingAsset = project.missingAssets[0];
  const contentIdea = project.contentIdeas[0];
  const readiness = getReleaseReadiness(project);

  const chain = [
    {
      title: blockedTask ? `Clear blocker on ${blockedTask.title}` : project.nextStep,
      detail: blockedTask?.unblock ?? "Push the main room move before the day gets fragmented.",
      tone: blockedTask ? "Urgent" : readiness.score >= 75 ? "Ready" : "Active",
      reason: blockedTask ? "Unblocking this restores downstream momentum." : "This is the highest-leverage room action right now.",
    },
    {
      title: missingAsset ? `Lock ${missingAsset}` : `Finish ${nextTask?.title ?? "the active room task"}`,
      detail: missingAsset
        ? "The package still has a visible gap. Close it before expanding the rollout."
        : `${nextTask?.dueLabel ?? "Today"} · keep execution moving so the room does not slip back into planning.`,
      tone: missingAsset ? "Package" : "Execution",
      reason: missingAsset ? "A tighter package makes every later move easier." : "Finishing active work keeps pressure from stacking up.",
    },
    {
      title: followUp
        ? `Follow up with ${followUp.name}`
        : draftOutreach
          ? `Send ${draftOutreach.name}`
          : `Ship ${contentIdea ?? "one visible content move"}`,
      detail: followUp
        ? "The room already created contact momentum. Do not let it go cold."
        : draftOutreach
          ? "A drafted contact is close enough to become a real outward move."
          : "Use one idea to create external proof of motion this week.",
      tone: followUp ? "Follow-up" : draftOutreach ? "Outreach" : "Output",
      reason: "Pocket should always end the chain with visible external movement.",
    },
  ];

  return chain;
}

export function getAutopilotStack(sourceProjects: Project[] = projects) {
  return sourceProjects
    .flatMap((project) =>
      getAutopilotRecommendations(project).map((item, index) => ({
        id: `${project.id}-autopilot-${index}`,
        projectId: project.id,
        projectName: project.name,
        step: index + 1,
        title: item.title,
        detail: item.detail,
        tone: item.tone,
        reason: item.reason,
        score: (index === 0 ? 90 : index === 1 ? 72 : 58) + Math.max(0, 21 - project.daysLeft),
      })),
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

export function getPocketExecutionLanes(sourceProjects: Project[] = projects) {
  return [
    {
      title: "Move now",
      detail: "Top-priority actions that should be handled from the phone in the next few minutes.",
      items: getTodayQueue(sourceProjects).slice(0, 3).map((task) => `${task.projectName}: ${task.title}`),
    },
    {
      title: "Clear drag",
      detail: "Blockers and missing assets that are slowing the rooms down.",
      items: sourceProjects
        .flatMap((project) =>
          project.missingAssets.slice(0, 1).map((asset) => `${project.name}: ${asset}`),
        )
        .slice(0, 3),
    },
    {
      title: "Create output",
      detail: "Content, outreach, or asset moves that turn planning into visible progress.",
      items: sourceProjects.map((project) => `${project.name}: ${project.contentIdeas[0]}`).slice(0, 3),
    },
  ] as const;
}

export function getTopThreePriorities(sourceProjects: Project[] = projects) {
  return getTodayQueue(sourceProjects).slice(0, 3).map((task, index) => ({
    rank: index + 1,
    title: task.title,
    projectName: task.projectName,
    why:
      task.blocked
        ? "This is blocking downstream release movement."
        : task.status === "In progress"
          ? "This already has momentum and should be finished cleanly."
          : "This is the highest-leverage next move in the stack.",
  }));
}

export function getManagerMemory() {
  return [
    "Visual approvals tend to become the drag point late in the timeline.",
    "Short next-action lists work better than broad planning systems.",
    "Momentum improves when outreach and content are built before release week.",
  ] as const;
}

export function getProjectMemory(project: Project) {
  return [
    `The ${project.name} room gets stronger when visuals are locked before broad outreach starts.`,
    project.daysLeft <= 14
      ? "Late-window planning bloat is more dangerous than imperfect execution."
      : "This room still has enough runway to build stronger assets before the hard push.",
    project.outreach.some((item) => item.status !== "Not contacted")
      ? "There is already some outward motion, so follow-through matters more than new brainstorming."
      : "No real outreach memory exists yet, so the first push should be more intentional than broad.",
  ] as const;
}

export function getOpportunityFeed(project: Project) {
  const feed = [
    {
      title: "Package opportunity",
      detail:
        project.missingAssets.length <= 1
          ? "The room is close enough that one sharp finishing move could make the release feel ready."
          : `Lock ${project.missingAssets[0]?.toLowerCase() ?? "the main blocker"} and the room gets materially stronger fast.`,
    },
    {
      title: "Outreach opportunity",
      detail: project.outreach.some((item) => item.status === "Draft" || item.status === "In progress")
        ? "There is enough outreach motion to turn drafts into real sends this week."
        : "A tighter first outreach batch would create more signal than more internal planning.",
    },
    {
      title: "Content opportunity",
      detail:
        project.contentIdeas.length >= 2
          ? "The room already has enough raw ideas to turn into a short content run."
          : "One better content angle could unlock the whole release world.",
    },
  ];

  return feed;
}

export function getContentStatusBoard(project: Project) {
  const firstMissingAsset = project.missingAssets[0];

  return [
    {
      status: "Idea",
      title: project.contentIdeas[0] ?? "First rollout concept",
      detail: "Start with the concept that gives the release its clearest first impression.",
    },
    {
      status: "Drafting",
      title: project.contentIdeas[1] ?? "Caption and teaser drafting",
      detail: "Turn one concept into actual words, shot ideas, and a usable post draft.",
    },
    {
      status: "Needs asset",
      title: firstMissingAsset ?? "Supporting visual locked",
      detail: firstMissingAsset
        ? `This lane is waiting on ${firstMissingAsset.toLowerCase()} before it can feel finished.`
        : "The main supporting assets are present enough for content to move.",
    },
    {
      status: "Ready to post",
      title: project.contentIdeas[2] ?? "Launch-ready content beat",
      detail: "This should be the next content piece that gets cleared and queued.",
    },
    {
      status: "Scheduled",
      title: `Queue around ${project.daysLeft <= 14 ? "the release window" : "the next clean momentum pocket"}`,
      detail: "The room should convert strong content into dated moves, not let it float as ideas.",
    },
    {
      status: "Posted",
      title: "Capture reactions and follow-ups",
      detail: "Once something ships, Pocket should preserve learnings and suggest the next touch.",
    },
  ] as const;
}

export function getReleaseRiskReport(project: Project) {
  const risks: Array<{ title: string; level: "Low" | "Medium" | "High"; detail: string }> = [
    {
      title: "Visual weakness",
      level: project.missingAssets.some((asset) => /cover|visual|photo/i.test(asset)) ? "High" : "Low",
      detail: project.missingAssets.some((asset) => /cover|visual|photo/i.test(asset))
        ? "The release package still looks incomplete because a key visual layer is missing or soft."
        : "The visual layer is strong enough that it should not be the main failure point.",
    },
    {
      title: "Outreach weakness",
      level: project.outreach.every((item) => item.status === "Not contacted") ? "High" : "Medium",
      detail: project.outreach.every((item) => item.status === "Not contacted")
        ? "There is no real outward motion yet, so the release could land quietly."
        : "Outreach exists, but it still needs sharper follow-through and timing.",
    },
    {
      title: "Timeline pressure",
      level: project.daysLeft <= 14 ? "High" : project.daysLeft <= 21 ? "Medium" : "Low",
      detail:
        project.daysLeft <= 14
          ? "The room is close enough to release that drift will hurt more than imperfect execution."
          : "There is still some runway, but weak sequencing could waste it.",
    },
  ];

  const topRisk = risks.sort((left, right) => riskScore(right.level) - riskScore(left.level))[0];

  return {
    headline: `Biggest risk right now: ${topRisk.title.toLowerCase()}.`,
    fixFirst:
      topRisk.title === "Visual weakness"
        ? project.missingAssets[0] ?? "Lock the visual package"
        : topRisk.title === "Outreach weakness"
          ? "Move the first credible outreach batch from draft to sent"
          : project.nextStep,
    items: risks,
  };
}

function riskScore(level: "Low" | "Medium" | "High") {
  if (level === "High") return 3;
  if (level === "Medium") return 2;
  return 1;
}

export function getAssetActionLinks(project: Project) {
  return project.assets.map((asset, index) => ({
    asset: asset.name,
    status: asset.status,
    project: project.name,
    tiedTo:
      project.tasks[index]?.title ??
      project.nextStep,
    usage:
      project.contentIdeas[index]
        ? `Best used in ${project.contentIdeas[index].toLowerCase()}.`
        : "Not assigned to a visible rollout step yet.",
  }));
}

export function getCollaborationPockets(project: Project) {
  const defaults =
    project.name === "Late Nights"
      ? [
          { role: "Designer", name: "Cover artist lane", status: "Needs approval handoff" },
          { role: "Photographer", name: "Press photo select", status: "Waiting on shortlist" },
          { role: "Engineer", name: "Master package", status: "Ready to finalize" },
        ]
      : [
          { role: "Videographer", name: "Visualizer direction", status: "Needs concept lock" },
          { role: "Designer", name: "Neon world assets", status: "In progress" },
          { role: "Producer", name: "BTS clip support", status: "Needs scheduling" },
        ];

  return defaults.map((item) => ({
    ...item,
    note: `${item.role} support should stay light but organized inside the room.`,
  }));
}

export function getWhatAmIMissing(project: Project) {
  const missing: string[] = [...project.missingAssets];

  if (!project.outreach.some((item) => item.status !== "Not contacted")) {
    missing.push("Outreach prep");
  }

  if (!project.contentIdeas.length) {
    missing.push("Content angles");
  }

  if (!project.assets.some((asset) => asset.type === "Audio" && asset.status === "Ready")) {
    missing.push("Final audio");
  }

  return missing;
}

export function getCompanionProfile(project: Project) {
  return {
    name: "Milo",
    role: "Personal AI running mate",
    mode: "Direct mode",
    specialty: "Turns loose thoughts into tasks, reminders, pitch drafts, and rollout moves.",
    canCarry: [
      "Turn a voice note into a plan",
      "Draft playlist and curator outreach",
      "Queue follow-up reminders",
      "Convert manager guidance into tasks and notes",
    ],
    currentHelp: `Right now Milo would carry ${project.tasks[0]?.title.toLowerCase() ?? "the next top task"} and prep the follow-through around it.`,
  };
}

export function getTasteBoard(project: Project) {
  const hasVisualBlocker = project.missingAssets.some((asset) =>
    /cover|visual|photo/i.test(asset),
  );
  const hasTeaser = project.assets.some((asset) => /teaser|clip/i.test(asset.name));

  return [
    {
      title: "Visual strength",
      verdict: hasVisualBlocker ? "Too soft right now" : "Strong enough to push",
      detail: hasVisualBlocker
        ? "The release world still feels incomplete because the main visual package is not locked."
        : "The room has enough visual shape to support rollout without apology.",
    },
    {
      title: "Rollout feel",
      verdict: hasTeaser ? "Has movement" : "Needs a sharper hook",
      detail: hasTeaser
        ? "There is at least one visible teaser or supporting angle that can become momentum."
        : "The campaign still needs a clearer first impression so people feel the record quickly.",
    },
    {
      title: "Pitch strength",
      verdict: project.outreach.some((item) => item.status !== "Not contacted") ? "Pitchable soon" : "Needs setup",
      detail: project.outreach.some((item) => item.status !== "Not contacted")
        ? "There is enough pitch structure to start shaping a credible push."
        : "Without real outreach prep, the release package still feels half-spoken.",
    },
  ] as const;
}

export function getDecisionEngine(project: Project) {
  const hasBlockedCreate = project.tasks.some((task) => task.blocked && task.lane === "Create");
  const hasBlockedPromo = project.tasks.some((task) => task.blocked && task.lane === "Promo");

  return [
    {
      title: "What to decide now",
      detail:
        hasBlockedCreate || project.missingAssets.length
          ? `Finish ${project.missingAssets[0] ?? "the main blocker"} before asking the rollout to carry more weight.`
          : `Push ${project.nextStep.toLowerCase()} before the room loses urgency.`,
    },
    {
      title: "What not to force yet",
      detail: hasBlockedPromo
        ? "Do not over-pitch while the release package is still missing obvious support assets."
        : "Do not add more planning layers before the current visible tasks are finished.",
    },
    {
      title: "Highest-leverage call",
      detail:
        project.daysLeft <= 14
          ? "Prioritize the package and first outward-facing assets over deeper brainstorming."
          : "Use the extra runway to build a stronger content and outreach stack now.",
    },
  ] as const;
}

export function getRevenueBrain(project: Project) {
  return [
    {
      title: "Fastest money angle",
      detail:
        project.stage === "Pre-release"
          ? "Use the release to seed fan offers, pre-order style bundles, or a lightweight paid drop later."
          : "Use active momentum to point people toward a paid product, service, or merch bridge.",
    },
    {
      title: "Best spend right now",
      detail:
        project.missingAssets.length
          ? `Spend on ${project.missingAssets[0].toLowerCase()} before ads or broad distribution pushes.`
          : "Spend on the asset or channel that makes the release easier to believe, not just easier to post.",
    },
    {
      title: "Waste to avoid",
      detail:
        project.daysLeft <= 14
          ? "Do not spread budget across too many weak moves during a tight window."
          : "Do not spend early just because money exists; spend when the package is strong enough to convert.",
    },
  ] as const;
}

export function getSongWorld(project: Project) {
  const world = project.name === "Late Nights"
    ? {
        visual: "Night-drive visuals, sodium glow, blurred city motion, low-light confidence.",
        pitch: "Frame it as a late-night record with cinematic mood and intimacy, not generic chill.",
        caption: "Speak in short, cool lines that feel lived-in, not over-explained.",
        rollout: "Lean into nocturnal mood, studio fragments, and one-line hooks that feel like scenes.",
      }
    : {
        visual: "Neon-tinted pop visuals, brighter color rhythm, clean motion, hopeful tension.",
        pitch: "Frame it as a melodic release with replay value and strong visual world potential.",
        caption: "Use cleaner, brighter, slightly more open language without losing edge.",
        rollout: "Build a color-led sequence and keep the energy forward instead of overly mysterious.",
      };

  return world;
}

export function getMiniPromoAssets(project: Project): MiniPromoAsset[] {
  const songWorld = getSongWorld(project);
  const missingVisual = project.missingAssets.find((asset) => /cover|visual|photo|clip|footage|video/i.test(asset));
  const audioReady = project.assets.some((asset) => asset.type === "Audio" && asset.status === "Ready");
  const leadIdea = project.contentIdeas[0] ?? project.nextStep;
  const secondIdea = project.contentIdeas[1] ?? songWorld.rollout;
  const leadAsset = project.assets[0]?.name ?? "the main file";
  const roleContext = project.type.toLowerCase().includes("single")
    ? "song"
    : project.type.toLowerCase();

  return [
    {
      title: "Hook teaser",
      format: "15-second clip",
      status: audioReady && !missingVisual ? "Ready to draft" : "Needs file",
      copy: `Use ${project.name} as a short ${roleContext} teaser: ${leadIdea}.`,
      use: "Post as the first short-form clip or story preview.",
      source: audioReady ? leadAsset : "Needs main audio",
    },
    {
      title: "Caption starter",
      format: "Post copy",
      status: "Ready to draft",
      copy: `${songWorld.caption} Tie the caption to ${project.name} without over-explaining it.`,
      use: "Use for Instagram, TikTok caption, YouTube Shorts, or a DJ/producer post.",
      source: "Song world",
    },
    {
      title: "Story card",
      format: "Story / flyer text",
      status: missingVisual ? "Needs file" : "Needs review",
      copy: `${songWorld.visual} Keep the message simple: what it is, why it matters, and when to listen.`,
      use: "Use as a story frame, gig plug, beat-pack post, or session recap.",
      source: missingVisual ?? "Visual direction",
    },
    {
      title: "Creator brief",
      format: "Collab prompt",
      status: project.outreach.length ? "Ready to draft" : "Needs review",
      copy: `Ask a creator or collaborator to respond to ${project.name} with ${secondIdea.toLowerCase()}.`,
      use: "Use for creator outreach, playlist pitch context, or a collaborator ask.",
      source: project.outreach[0]?.name ?? "Outreach lane",
    },
  ];
}

export function getCalmCreativePath(project: Project): CalmCreativePath {
  const promoAsset = getMiniPromoAssets(project)[0];
  const blocker = project.missingAssets[0];
  const nextTask = project.tasks.find((task) => task.status !== "Done");
  const firstAction = blocker ? `Clear ${blocker}` : project.nextStep;
  const promoAction = promoAsset
    ? `Make ${promoAsset.title.toLowerCase()} for ${project.name}`
    : `Make one small promo piece for ${project.name}`;

  return {
    headline: blocker
      ? `Do not carry the whole room. Clear ${blocker.toLowerCase()} first.`
      : "The room is calm enough to push one public move.",
    promise: "Pocket reduces stress by turning the creative stack into one clear room, one next move, and one small output.",
    bestShortcut: project.daysLeft <= 14 ? "Do less, ship the strongest next piece." : "Build the room slowly enough that the work stays clean.",
    steps: [
      {
        label: "First",
        action: firstAction,
        detail: blocker
          ? "One missing piece is creating more noise than the rest of the room. Handle it before expanding the plan."
          : "Start with the manager's next move instead of reopening every decision.",
        lane: blocker ? "Admin" : nextTask?.lane ?? "Create",
      },
      {
        label: "Then",
        action: promoAction,
        detail: "Turn the work into one small shareable asset so momentum becomes visible.",
        lane: "Promo",
      },
      {
        label: "Later",
        action: `Pocket one note or reference for ${project.name}`,
        detail: "Save loose thoughts without letting them become another world to manage.",
        lane: "Personal",
      },
    ],
  };
}

export function getStudioPipeline(project: Project) {
  const audioReady = project.assets.some((asset) => asset.type === "Audio" && asset.status === "Ready");
  const hasClean = project.missingAssets.some((asset) => /clean/i.test(asset))
    ? "Needs work"
    : "Ready";

  return [
    {
      title: "Demo / source state",
      status: audioReady ? "Captured" : "Needs confirmation",
      detail: audioReady ? "The main audio file is already in the room." : "The room still needs its primary source audio.",
    },
    {
      title: "Master state",
      status: audioReady ? "Ready" : "Needs work",
      detail: audioReady ? "A mastered file is present enough to move the package forward." : "Master delivery still needs to land cleanly.",
    },
    {
      title: "Clean version",
      status: hasClean,
      detail:
        hasClean === "Ready"
          ? "The room does not show a clean-version blocker right now."
          : "Clean-version readiness is still part of the release drag.",
    },
    {
      title: "Final confidence",
      status: project.missingAssets.length <= 1 ? "Close" : "Soft",
      detail:
        project.missingAssets.length <= 1
          ? "The room is close to a trustworthy final package."
          : "Too many loose ends still make the package feel provisional.",
    },
  ] as const;
}

export function getAudienceOwnershipLayer(project: Project) {
  return [
    {
      title: "Closest audience pocket",
      detail:
        project.outreach[0]?.name
          ? `Start with ${project.outreach[0].name} and people adjacent to that lane instead of broad random reach.`
          : "Build one tight audience pocket before chasing wider reach.",
    },
    {
      title: "What to capture",
      detail: "Keep notes on who responds, who shares, who asks questions, and who keeps showing up around the record.",
    },
    {
      title: "What to say next",
      detail:
        project.daysLeft <= 14
          ? "Invite people into the release moment and give them a reason to care now."
          : "Use the runway to build familiarity before you ask for the hard push.",
    },
  ] as const;
}

export function getEmergencyMode(project: Project) {
  const mustDo = [
    project.missingAssets[0] ? `Lock ${project.missingAssets[0].toLowerCase()}` : project.nextStep,
    project.tasks.find((task) => !task.blocked)?.title ?? "Finish one visible task",
    project.contentIdeas[0] ? `Ship ${project.contentIdeas[0].toLowerCase()}` : "Ship one outward-facing content move",
  ];

  return {
    title: "Save this release",
    warning:
      project.daysLeft <= 14
        ? "The room is in a tight enough window that extra planning could become delay."
        : "The room still has runway, but drift will make the final window uglier.",
    mustDo,
    cut: "Cut anything that does not improve the package, the first impression, or the immediate rollout path.",
  };
}

export function getCompanionActions(project: Project) {
  return [
    {
      type: "Create task",
      title: `Create task: ${project.missingAssets[0] ?? "Lock the next missing asset"}`,
      detail: "Add a concrete task to clear the biggest missing piece in the room.",
      payload: `Task · ${project.missingAssets[0] ?? "Next missing asset"} · due Today · owner Create`,
    },
    {
      type: "Save note",
      title: `Save note: ${project.contentIdeas[0] ?? "New rollout angle"}`,
      detail: "Store the strongest content or rollout idea as project memory before it disappears.",
      payload: `Note · ${project.name} · ${project.contentIdeas[0] ?? "Turn this release angle into a note"}`,
    },
    {
      type: "Make pitch draft",
      title: `Pitch draft for ${project.outreach[0]?.name ?? "playlist outreach"}`,
      detail: "Generate a first-pass pitch draft using the song angle, mood, and current room context.",
      payload: `Pitch · ${project.outreach[0]?.type ?? "Playlist"} · ${project.name} · draft status`,
    },
    {
      type: "Queue follow-up",
      title: `Follow up with ${project.outreach.find((item) => item.status === "Follow-up due")?.name ?? project.outreach[0]?.name ?? "outreach target"}`,
      detail: "Create a follow-up reminder so promo momentum does not go stale.",
      payload: `Reminder · follow-up due in 2 days · link to outreach item`,
    },
    {
      type: "Voice note to plan",
      title: "Turn voice note into plan",
      detail: "Convert a messy thought into tasks, missing assets, deadlines, and the next moves.",
      payload: "Plan output · tasks + assets + outreach + budget moves",
    },
  ] as const;
}

export function getManagerOutputConversions(project: Project) {
  return [
    {
      type: "Task",
      title: `Convert "${project.nextStep}" into a must-do task`,
      detail: "Strategy becomes a dated task with urgency and owner context.",
    },
    {
      type: "Pitch draft",
      title: `Create first-pass outreach for ${project.outreach[0]?.name ?? "the lead target"}`,
      detail: "Manager output becomes a usable draft, not just advice about drafting.",
    },
    {
      type: "Content item",
      title: `Queue ${project.contentIdeas[0]?.toLowerCase() ?? "the lead content angle"} as a real rollout move`,
      detail: "Content guidance drops into the room as an actual content object.",
    },
    {
      type: "Reminder",
      title: "Set the next follow-up and unblock reminder",
      detail: "The manager preserves timing so momentum does not vanish between sessions.",
    },
  ] as const;
}

export function getNewRoomPreview(sourceProjects: Project[] = projects) {
  const project = sourceProjects[0];
  const readiness = getReleaseReadiness(project);
  const risk = getReleaseRiskReport(project);

  return {
    roomName: `${projectTemplates[0]?.title ?? "Release room"} preview`,
    readiness: readiness.score,
    risk: risk.headline,
    firstMoves: [
      project.priorities[0] ?? project.nextStep,
      project.missingAssets[0] ? `Clear ${project.missingAssets[0].toLowerCase()}` : "Clear the main blocker",
      project.contentIdeas[0] ?? "Turn one idea into a real rollout move",
    ],
  };
}
