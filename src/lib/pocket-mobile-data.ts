export const mobileTabs = [
  { label: "Home", href: "/dashboard" },
  { label: "App", href: "/mobile" },
  { label: "Past Work", href: "/projects" },
  { label: "Pocket", href: "/pocket" },
  { label: "Vault", href: "/vault" },
  { label: "Profile", href: "/settings" },
] as const;

export const quickCaptureActions = [
  {
    title: "Add task",
    copy: "Pocket the next thing that needs doing before it disappears.",
  },
  {
    title: "Voice note",
    copy: "Save a thought, lyric idea, or rollout note while moving.",
  },
  {
    title: "Add file",
    copy: "Throw artwork, audio, or references into the active project vault fast.",
  },
] as const;

export const mobileMoments = [
  "Open the app and know the top 3 priorities instantly.",
  "Jump from a notification into the active project without hunting.",
  "Pocket ideas, files, and tasks from the phone in seconds.",
  "Ask the AI manager what matters next while on the move.",
] as const;

export const mobileOperatingModes = [
  {
    title: "Commute mode",
    copy: "Only show urgent moves, blockers, and one fast Pocket action.",
  },
  {
    title: "Session mode",
    copy: "Keep the active project open with tasks, missing assets, and voice notes close.",
  },
  {
    title: "Manager mode",
    copy: "Lead with the manager brief, sprint moves, and rollout support prompts.",
  },
] as const;
