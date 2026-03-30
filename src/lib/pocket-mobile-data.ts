export const mobileTabs = [
  { label: "Today", href: "/dashboard" },
  { label: "Mobile", href: "/mobile" },
  { label: "Projects", href: "/projects" },
  { label: "Capture", href: "/manager" },
  { label: "Vault", href: "/projects" },
  { label: "Settings", href: "/settings" },
] as const;

export const quickCaptureActions = [
  {
    title: "Quick task",
    copy: "Drop the next thing that needs doing before it disappears.",
  },
  {
    title: "Voice note",
    copy: "Capture a thought, lyric idea, or rollout note while moving.",
  },
  {
    title: "Upload asset",
    copy: "Throw artwork, audio, or references into the active project vault fast.",
  },
] as const;

export const mobileMoments = [
  "Open the app and know the top 3 priorities instantly.",
  "Jump from a notification into the active project without hunting.",
  "Capture ideas, files, and tasks from the phone in seconds.",
  "Ask the AI manager what matters next while on the move.",
] as const;

export const mobileOperatingModes = [
  {
    title: "Commute mode",
    copy: "Only show urgent moves, blockers, and one fast capture action.",
  },
  {
    title: "Session mode",
    copy: "Keep the active project open with tasks, missing assets, and voice capture close.",
  },
  {
    title: "Manager mode",
    copy: "Lead with the manager brief, sprint moves, and rollout support prompts.",
  },
] as const;
