"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSupabase } from "@/lib/supabase";
import {
  CreatorMoneyEntry,
  MoneyEntryType,
  PlatformConnection,
  PlatformConnectionStatus,
  Project,
  RevenueStream,
  seedMoneyEntries,
  seedPlatformConnections,
  seedProjects,
  seedSongs,
  SongCatalogItem,
} from "@/lib/backstage-data";
import { TaskStatus } from "@/lib/backstage-data";

const PROJECTS_STORAGE_KEY = "pocket-manager-projects";
const PROFILE_STORAGE_KEY = "pocket-manager-profile";
const SESSION_STORAGE_KEY = "pocket-manager-session";
const EVENTS_STORAGE_KEY = "pocket-manager-events";
const MONEY_STORAGE_KEY = "pocket-manager-money";
const SONGS_STORAGE_KEY = "pocket-manager-songs";
const PLATFORMS_STORAGE_KEY = "pocket-manager-platforms";

type CreateProjectInput = {
  name: string;
  type: string;
  vibe: string;
  stage: string;
  targetDate: string;
  goal: string;
};

type CreateSongInput = {
  title: string;
  isrc: string;
  upc?: string;
  releaseDate: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  musicalKey?: string;
  language?: string;
  territory?: string;
  distributor: string;
  collaborators?: SongCatalogItem["collaborators"];
};

type AddCollaboratorInput = {
  name: string;
  role: SongCatalogItem["collaborators"][number]["role"];
  ownershipPercentage: number;
  signed: boolean;
};

type SongMetadataInput = Partial<
  Pick<SongCatalogItem, "isrc" | "upc" | "releaseDate" | "genre" | "mood" | "bpm" | "musicalKey" | "language" | "territory">
>;

type ProfileInput = {
  artistName: string;
  role: string;
  vibe: string;
  currentProject: string;
  targetWindow: string;
  mainGoal: string;
  managerMode: string;
};

type AddTaskInput = {
  title: string;
  lane: "Create" | "Admin" | "Promo" | "Personal";
  dueLabel: string;
  energy: "Light" | "Medium" | "Heavy";
};

type AddAssetInput = {
  name: string;
  type: string;
  status: string;
};

type AddOutreachInput = {
  name: string;
  type: string;
  status: string;
};

type UploadAssetInput = {
  name: string;
  sizeLabel: string;
  type: string;
  status: string;
};

type AddMoneyEntryInput = {
  type: MoneyEntryType;
  amount: number;
  source: string;
  category: string;
  note: string;
};

type ManagerComposerInput = {
  intent: "Task" | "Pitch draft" | "Content item" | "Reminder" | "Asset";
  brief: string;
};

type PocketProfile = ProfileInput & {
  onboarded: boolean;
  email?: string;
  plan?: "free" | "pro" | "elite";
  stripeCustomerId?: string;
};

type PocketSnapshot = {
  version: 1;
  exportedAt: string;
  profile: PocketProfile;
  signedIn: boolean;
  projects: Project[];
  events: PocketEvent[];
  moneyEntries?: CreatorMoneyEntry[];
  songs?: SongCatalogItem[];
  platformConnections?: PlatformConnection[];
};

export type PocketEvent = {
  id: string;
  projectId: string;
  title: string;
  detail: string;
  kind: "Task" | "Vault" | "Outreach" | "Manager" | "Capture" | "Room" | "Money";
  emphasis: string;
  createdAt: string;
};

type PocketContextValue = {
  projects: Project[];
  songs: SongCatalogItem[];
  platformConnections: PlatformConnection[];
  activeProject: Project;
  profile: PocketProfile;
  signedIn: boolean;
  events: PocketEvent[];
  moneyEntries: CreatorMoneyEntry[];
  createProject: (input: CreateProjectInput) => string | null;
  createSong: (input: CreateSongInput) => string | null;
  addSongCollaborator: (songId: string, input: AddCollaboratorInput) => void;
  updateSongMetadata: (songId: string, input: SongMetadataInput) => void;
  completeRevenueAction: (songId: string, streamType: string, collectionBody: string) => void;
  updatePlatformConnection: (platformId: string, status: PlatformConnectionStatus) => void;
  convertManagerAction: (projectId: string, actionType: string) => void;
  updateTaskStatus: (projectId: string, taskTitle: string, status: TaskStatus) => void;
  updateOutreachStatus: (projectId: string, contactName: string, status: string) => void;
  addTask: (projectId: string, input: AddTaskInput) => void;
  addMoneyEntry: (projectId: string, input: AddMoneyEntryInput) => void;
  addAsset: (projectId: string, input: AddAssetInput) => void;
  addOutreachContact: (projectId: string, input: AddOutreachInput) => void;
  uploadAssets: (projectId: string, uploads: UploadAssetInput[]) => void;
  addQuickAsset: (projectId: string, assetLabel: string) => void;
  addQuickContentIdea: (projectId: string, idea: string) => void;
  runManagerComposer: (projectId: string, input: ManagerComposerInput) => void;
  signIn: (email: string) => void;
  signOut: () => void;
  completeOnboarding: (input: Omit<ProfileInput, "managerMode"> & { managerMode?: string }) => void;
  updateProfile: (updates: Partial<PocketProfile>) => void;
  exportPocketData: () => string;
  importPocketData: (rawSnapshot: string) => { ok: boolean; message: string };
  resetPocketData: () => void;
  resolveMissingAsset: (projectId: string, assetName: string) => void;
  setActiveProject: (projectId: string) => void;
};

const PocketContext = createContext<PocketContextValue | null>(null);

export function PocketProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [songs, setSongs] = useState<SongCatalogItem[]>([]);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [profile, setProfile] = useState<PocketProfile>(getDefaultProfile);
  const [signedIn, setSignedIn] = useState(false);
  const [events, setEvents] = useState<PocketEvent[]>([]);
  const [moneyEntries, setMoneyEntries] = useState<CreatorMoneyEntry[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const rawProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (rawProjects) {
          const parsed = JSON.parse(rawProjects) as Project[];
          setProjects(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
      }

      try {
        const rawProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (rawProfile) {
          setProfile({ ...getDefaultProfile(), ...(JSON.parse(rawProfile) as Partial<PocketProfile>) });
        }
      } catch {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      }

      setSignedIn(window.localStorage.getItem(SESSION_STORAGE_KEY) === "signed-in");

      try {
        const rawEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);
        if (rawEvents) {
          const parsed = JSON.parse(rawEvents) as PocketEvent[];
          setEvents(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        window.localStorage.removeItem(EVENTS_STORAGE_KEY);
      }

      try {
        const rawMoney = window.localStorage.getItem(MONEY_STORAGE_KEY);
        if (rawMoney) {
          const parsed = JSON.parse(rawMoney) as CreatorMoneyEntry[];
          setMoneyEntries(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        window.localStorage.removeItem(MONEY_STORAGE_KEY);
      }

      try {
        const rawSongs = window.localStorage.getItem(SONGS_STORAGE_KEY);
        if (rawSongs) {
          const parsed = JSON.parse(rawSongs) as SongCatalogItem[];
          setSongs(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        window.localStorage.removeItem(SONGS_STORAGE_KEY);
      }

      try {
        const rawPlatforms = window.localStorage.getItem(PLATFORMS_STORAGE_KEY);
        if (rawPlatforms) {
          const parsed = JSON.parse(rawPlatforms) as PlatformConnection[];
          setPlatformConnections(Array.isArray(parsed) ? mergeSeedPlatforms(parsed) : []);
        }
      } catch {
        window.localStorage.removeItem(PLATFORMS_STORAGE_KEY);
      }

      setHydrated(true);
    });
  }, []);

  // Catalog sync — load from Supabase on sign-in, debounce-push on changes
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);

  // Load catalog from Supabase and merge with local songs (server wins on conflict)
  async function loadCatalogFromServer(token: string, localSongs: SongCatalogItem[]) {
    try {
      const res = await fetch("/api/v1/catalog", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json() as { songs?: unknown[] };
      if (!Array.isArray(json.songs) || json.songs.length === 0) return;
      const serverSongs = json.songs as SongCatalogItem[];
      // Merge: server songs take precedence, append any local-only songs
      const serverIds = new Set(serverSongs.map((s) => s.id));
      const localOnly = localSongs.filter((s) => !serverIds.has(s.id));
      setSongs([...serverSongs, ...localOnly]);
    } catch {
      // Non-fatal — continue with local data
    }
  }

  async function pushCatalogToServer(token: string, currentSongs: SongCatalogItem[]) {
    try {
      await fetch("/api/v1/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ songs: currentSongs }),
      });
    } catch {
      // Non-fatal
    }
  }

  // Debounced push whenever songs change and user is authenticated
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated || !supabaseToken) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      void pushCatalogToServer(supabaseToken, songs);
    }, 2000);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs, supabaseToken, hydrated]);

  // Supabase auth listener — keeps signedIn in sync with real session
  useEffect(() => {
    const client = getSupabase();
    if (!client) return; // env vars not set — skip, localStorage auth still works

    // Sync profile to Supabase after authentication
    async function syncProfileToServer(token: string, currentProfile: PocketProfile) {
      try {
        await fetch("/api/v1/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            artistName: currentProfile.artistName,
            role: currentProfile.role,
            vibe: currentProfile.vibe,
            onboarded: currentProfile.onboarded,
          }),
        });
      } catch {
        // Non-fatal — local data is still intact
      }
    }

    // Check existing session on mount
    void (async () => {
      const { data } = await client.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        setSignedIn(true);
        setSupabaseToken(session.access_token);
        setProfile((current) => {
          const updated = {
            ...current,
            email: (session.user.email as string | undefined) ?? current.email,
            artistName: current.artistName || (session.user.user_metadata?.artist_name as string | undefined) || session.user.email?.split("@")[0] || current.artistName,
          };
          void syncProfileToServer(session.access_token, updated);
          return updated;
        });
        // Load catalog from server and merge
        setSongs((current) => {
          void loadCatalogFromServer(session.access_token, current);
          return current;
        });
      }
    })();

    // Listen for auth state changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = client.auth.onAuthStateChange((_event: any, session: any) => {
      setSignedIn(Boolean(session?.user));
      if (session?.user && session.access_token) {
        setSupabaseToken(session.access_token as string);
        setProfile((current) => {
          const updated = {
            ...current,
            email: (session.user.email as string | undefined) ?? current.email,
          };
          void syncProfileToServer(session.access_token as string, updated);
          return updated;
        });
        setSongs((current) => {
          void loadCatalogFromServer(session.access_token as string, current);
          return current;
        });
      } else {
        setSupabaseToken(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [hydrated, projects]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [hydrated, profile]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, signedIn ? "signed-in" : "signed-out");
  }, [hydrated, signedIn]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }, [events, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(MONEY_STORAGE_KEY, JSON.stringify(moneyEntries));
  }, [hydrated, moneyEntries]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(songs));
  }, [hydrated, songs]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(platformConnections));
  }, [hydrated, platformConnections]);

  const value = useMemo<PocketContextValue>(() => {
    const activeProject = projects[0] ?? { id: "", name: "", type: "", stage: "", daysLeft: 0, goal: "", health: "", summary: "", managerNote: "", nextStep: "", priorities: [], missingAssets: [], assets: [], contentIdeas: [], outreach: [], tasks: [] } as Project;
    const pushEvent = (event: Omit<PocketEvent, "id" | "createdAt">) => {
      setEvents((current) => [
        {
          ...event,
          id: `${event.projectId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 120));
    };

    return {
      projects,
      songs,
      platformConnections,
      activeProject,
      profile,
      signedIn,
      events,
      moneyEntries,
      createProject(input) {
        const projectId = slugify(input.name);

        if (!projectId) {
          return null;
        }

        pushEvent({
          projectId,
          title: `Created room: ${input.name}`,
          detail: `${input.stage} ${input.type.toLowerCase()} room opened with ${input.targetDate.toLowerCase()} as the target window.`,
          kind: "Room",
          emphasis: "New room",
        });

        setProjects((current) => [
          {
            id: projectId,
            name: input.name,
            type: input.type,
            stage: input.stage,
            daysLeft: 28,
            goal: input.goal,
            health: "New room",
            summary: `${input.type} room shaped around ${input.vibe.toLowerCase()} with a ${input.stage.toLowerCase()} starting posture and a ${input.targetDate.toLowerCase()} target window.`,
            managerNote:
              "This room was just created. Lock the first package pieces fast so the manager can judge from something real.",
            nextStep: `Define the first concrete move for ${input.name}.`,
            priorities: [
              "Upload the first core asset",
              "Lock the strongest rollout angle",
              "Set the first dated move",
            ],
            missingAssets: ["Cover direction", "Primary rollout asset", "Pitch angle"],
            assets: [],
            contentIdeas: [
              `${input.vibe} teaser angle`,
              "Foundational caption draft",
              "First outward-facing rollout beat",
            ],
            outreach: [{ name: "First target list", type: "Playlist", status: "Draft" }],
            tasks: [
              {
                title: "Upload first asset pack",
                status: "To do",
                lane: "Create",
                dueLabel: "Today",
                energy: "Light",
              },
              {
                title: "Set first rollout move",
                status: "To do",
                lane: "Admin",
                dueLabel: "Tomorrow",
                energy: "Light",
              },
            ],
          },
          ...current.filter((project) => project.id !== projectId),
        ]);
        setProfile((current) => ({
          ...current,
          currentProject: input.name,
          targetWindow: input.targetDate,
        }));

        return projectId;
      },
      createSong(input) {
        const title = input.title.trim();
        const songId = slugify(title);

        if (!title || !songId) {
          return null;
        }

        const distributor = input.distributor || "Not connected";
        const hasDistributor = distributor !== "Not sure yet" && distributor !== "Not connected";
        const territory = input.territory?.trim() || "United States";
        const metadataComplete = Boolean(
          input.isrc.trim() &&
            input.upc?.trim() &&
            input.releaseDate &&
            input.genre?.trim() &&
            input.mood?.trim() &&
            input.bpm &&
            input.musicalKey?.trim() &&
            input.language?.trim() &&
            territory,
        );
        const song: SongCatalogItem = {
          id: songId,
          title,
          isrc: input.isrc.trim(),
          upc: input.upc?.trim(),
          releaseDate: input.releaseDate || "Release date needed",
          genre: input.genre?.trim(),
          mood: input.mood?.trim(),
          bpm: input.bpm,
          musicalKey: input.musicalKey?.trim(),
          language: input.language?.trim(),
          streams: 0,
          territory,
          collaborators: input.collaborators?.length
            ? input.collaborators
            : [{ name: profile.artistName || "You", role: "master_owner", ownershipPercentage: 100, signed: false }],
          distributionPlatforms: hasDistributor ? [distributor] : [],
          metadataComplete,
          artworkUploaded: false,
          splitSheetSigned: false,
          revenueStreams: buildStarterRevenueStreams(distributor),
        };

        pushEvent({
          projectId: songId,
          title: `Added song: ${title}`,
          detail: input.isrc ? `ISRC ${input.isrc} added to the catalog.` : "Manual song added. ISRC is still missing.",
          kind: "Room",
          emphasis: "Catalog",
        });

        setSongs((current) => [song, ...current.filter((item) => item.id !== songId)]);
        setProfile((current) => ({ ...current, currentProject: title }));

        return songId;
      },
      addSongCollaborator(songId, input) {
        const collaboratorName = input.name.trim();

        if (!collaboratorName) {
          return;
        }

        setSongs((current) =>
          current.map((song) => {
            if (song.id !== songId) {
              return song;
            }

            return {
              ...song,
              collaborators: [
                ...song.collaborators.filter((collaborator) => collaborator.name.toLowerCase() !== collaboratorName.toLowerCase()),
                {
                  name: collaboratorName,
                  role: input.role,
                  ownershipPercentage: Math.max(0, Math.min(100, Number(input.ownershipPercentage) || 0)),
                  signed: input.signed,
                },
              ],
              splitSheetSigned: input.signed && song.collaborators.every((collaborator) => collaborator.signed),
            };
          }),
        );

        pushEvent({
          projectId: songId,
          title: `Added split: ${collaboratorName}`,
          detail: `${input.ownershipPercentage}% ${input.role.replaceAll("_", " ")} split added to the song.`,
          kind: "Room",
          emphasis: input.signed ? "Signed" : "Unsigned",
        });
      },
      updateSongMetadata(songId, input) {
        setSongs((current) =>
          current.map((song) => {
            if (song.id !== songId) {
              return song;
            }

            const nextSong = {
              ...song,
              ...input,
              isrc: input.isrc ?? song.isrc,
              releaseDate: input.releaseDate ?? song.releaseDate,
              territory: input.territory ?? song.territory,
            };
            const metadataComplete = Boolean(
              nextSong.isrc &&
                nextSong.upc &&
                nextSong.releaseDate &&
                nextSong.genre &&
                nextSong.mood &&
                nextSong.bpm &&
                nextSong.musicalKey &&
                nextSong.language &&
                nextSong.territory,
            );

            return {
              ...nextSong,
              metadataComplete,
            };
          }),
        );

        pushEvent({
          projectId: songId,
          title: "Metadata updated",
          detail: "Song metadata was saved and readiness recalculated.",
          kind: "Room",
          emphasis: "Metadata",
        });
      },
      completeRevenueAction(songId, streamType, collectionBody) {
        setSongs((current) =>
          current.map((song) => {
            if (song.id !== songId) {
              return song;
            }

            return {
              ...song,
              revenueStreams: song.revenueStreams.map((stream) => {
                if (stream.streamType !== streamType || stream.collectionBody !== collectionBody) {
                  return stream;
                }

                return {
                  ...stream,
                  status: "collecting",
                  actualAmount: stream.actualAmount + stream.estimatedGap,
                  estimatedGap: 0,
                  reason: `${stream.collectionBody} action marked complete.`,
                  action: `Review ${stream.collectionBody}`,
                };
              }),
            };
          }),
        );

        pushEvent({
          projectId: songId,
          title: `Gap closed: ${collectionBody}`,
          detail: `${streamType.replaceAll("_", " ")} action was marked complete.`,
          kind: "Money",
          emphasis: "Closed",
        });
      },
      updatePlatformConnection(platformId, status) {
        const platform = platformConnections.find((item) => item.id === platformId);

        setPlatformConnections((current) =>
          current.map((item) =>
            item.id === platformId
              ? {
                  ...item,
                  status,
                  missingStep: status === "connected" ? "Connected" : item.missingStep,
                }
              : item,
          ),
        );

        if (status === "connected" && platform) {
          setSongs((current) =>
            current.map((song) => ({
              ...song,
              distributionPlatforms:
                platform.group === "Distributor" && !song.distributionPlatforms.includes(platform.name)
                  ? [platform.name, ...song.distributionPlatforms]
                  : song.distributionPlatforms,
              revenueStreams: song.revenueStreams.map((stream) =>
                streamMatchesPlatform(stream, platform)
                  ? {
                      ...stream,
                      status: stream.actualAmount > 0 ? "collecting" : "registered_not_collecting",
                      reason: `${platform.name} is connected. Import statements or verify reporting to confirm collection.`,
                      action: `Review ${platform.name}`,
                    }
                  : stream,
              ),
            })),
          );
        }

        pushEvent({
          projectId: songs[0]?.id ?? "catalog",
          title: `Platform ${status.replaceAll("_", " ")}: ${platform?.name ?? platformId}`,
          detail: status === "connected" ? "Platform connection marked connected in the prototype." : "Platform connection status updated.",
          kind: "Money",
          emphasis: status,
        });
      },
      convertManagerAction(projectId, actionType) {
        const normalizedActionType = normalizeManagerActionType(actionType);

        pushEvent({
          projectId,
          title: `Manager converted action: ${actionType}`,
          detail: "Pocket turned manager output into a saved room object.",
          kind: "Manager",
          emphasis: normalizedActionType,
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            if (normalizedActionType === "Task") {
              return {
                ...project,
                nextStep: `Finish manager follow-through for ${project.nextStep.toLowerCase()}`,
                managerNote: `Manager converted the next move into a task: ${project.nextStep}`,
                priorities: [`Finish manager follow-through`, ...project.priorities].slice(0, 5),
                tasks: [
                  {
                    title: `Manager follow-through: ${project.nextStep}`,
                    status: "To do",
                    lane: "Admin",
                    dueLabel: "Today",
                    energy: "Light",
                  },
                  ...project.tasks,
                ],
              };
            }

            if (normalizedActionType === "Pitch draft") {
              return {
                ...project,
                nextStep: `Review and send the draft for ${project.outreach[0]?.name ?? project.name}`,
                managerNote: `Manager opened an outreach draft for ${project.name}.`,
                priorities: [`Send outreach draft`, ...project.priorities].slice(0, 5),
                outreach: project.outreach.map((item, index) =>
                  index === 0 ? { ...item, status: "Draft" } : item,
                ),
              };
            }

            if (normalizedActionType === "Content item") {
              return {
                ...project,
                nextStep: `Turn the queued content move into a scheduled post for ${project.name}.`,
                managerNote: `Manager queued a content move for the room and pushed it into follow-through.`,
                priorities: [`Schedule new content move`, ...project.priorities].slice(0, 5),
                contentIdeas: [
                  `Queued by manager: ${project.contentIdeas[0] ?? "new rollout move"}`,
                  ...project.contentIdeas,
                ].slice(0, 4),
              };
            }

            if (normalizedActionType === "Reminder") {
              return {
                ...project,
                nextStep: "Check the saved follow-up and keep the room moving today.",
                managerNote: `${project.managerNote} Follow-up timing was saved so the room does not lose momentum.`,
                priorities: [`Check saved follow-up timing`, ...project.priorities].slice(0, 5),
              };
            }

            if (normalizedActionType === "Asset") {
              const nextAsset = project.missingAssets[0] ?? "Final release package asset";

              return {
                ...project,
                nextStep: `Upload or approve ${nextAsset.toLowerCase()} so the room can move.`,
                managerNote: `Manager turned the missing asset into a vault request: ${nextAsset}`,
                priorities: [`Upload or approve: ${nextAsset}`, ...project.priorities].slice(0, 5),
                missingAssets: project.missingAssets.includes(nextAsset)
                  ? project.missingAssets
                  : [nextAsset, ...project.missingAssets].slice(0, 6),
              };
            }

            return project;
          }),
        );
      },
      addTask(projectId, input) {
        pushEvent({
          projectId,
          title: input.title,
          detail: `${input.lane} lane task added for ${input.dueLabel}.`,
          kind: "Task",
          emphasis: "Added",
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              nextStep: input.title,
              managerNote: `Captured a new task for today: ${input.title}`,
              priorities: [input.title, ...project.priorities.filter((item) => item !== input.title)].slice(0, 5),
              tasks: [
                {
                  title: input.title,
                  status: "To do",
                  lane: input.lane,
                  dueLabel: input.dueLabel,
                  energy: input.energy,
                },
                ...project.tasks,
              ],
            };
          }),
        );
      },
      addMoneyEntry(projectId, input) {
        const amount = Math.max(0, Number(input.amount) || 0);

        if (!amount) {
          return;
        }

        const entry: CreatorMoneyEntry = {
          id: `money-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: input.type,
          amount,
          source: input.source || (input.type === "Income" ? "Creative income" : "Creative expense"),
          category: input.category || (input.type === "Income" ? "Other income" : "Other expense"),
          note: input.note,
          date: new Date().toISOString(),
        };

        pushEvent({
          projectId,
          title: `${entry.type}: ${entry.source}`,
          detail: `${entry.type} logged for $${entry.amount.toLocaleString("en-US")}.`,
          kind: "Money",
          emphasis: entry.type,
        });
        setMoneyEntries((current) => [entry, ...current].slice(0, 200));
      },
      addAsset(projectId, input) {
        pushEvent({
          projectId,
          title: input.name,
          detail: `${input.type} asset saved with ${input.status.toLowerCase()} status.`,
          kind: "Vault",
          emphasis: "Saved",
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              managerNote: `Saved a new room asset: ${input.name}`,
              assets: [
                {
                  name: input.name,
                  type: input.type,
                  status: input.status,
                },
                ...project.assets,
              ],
              priorities: [`Review asset: ${input.name}`, ...project.priorities].slice(0, 5),
              missingAssets: project.missingAssets.filter((item) => item.toLowerCase() !== input.name.toLowerCase()),
            };
          }),
        );
      },
      addOutreachContact(projectId, input) {
        pushEvent({
          projectId,
          title: input.name,
          detail: `${input.type} contact added with ${input.status.toLowerCase()} status.`,
          kind: "Outreach",
          emphasis: "Added",
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              managerNote: `Added outreach contact: ${input.name}`,
              outreach: [input, ...project.outreach],
              priorities: [`Reach out to ${input.name}`, ...project.priorities].slice(0, 5),
            };
          }),
        );
      },
      uploadAssets(projectId, uploads) {
        uploads.forEach((upload, index) => {
          pushEvent({
            projectId,
            title: upload.name,
            detail: `${upload.type} uploaded to the vault with ${upload.status.toLowerCase()} status.`,
            kind: "Vault",
            emphasis: index === 0 ? "New file" : "Uploaded",
          });
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId || uploads.length === 0) {
              return project;
            }

            const uploadNames = uploads.map((item) => item.name.toLowerCase());

            return {
              ...project,
              assets: [
                ...uploads.map((upload) => ({
                  name: `${upload.name} · ${upload.sizeLabel}`,
                  type: upload.type,
                  status: upload.status,
                })),
                ...project.assets,
              ],
              nextStep: `Review ${uploads[0].name} and connect it to the rollout package.`,
              priorities: [`Review uploaded file: ${uploads[0].name}`, ...project.priorities].slice(0, 5),
              missingAssets: project.missingAssets.filter(
                (item) => !uploadNames.some((name) => name.includes(item.toLowerCase()) || item.toLowerCase().includes(name)),
              ),
              managerNote: `${project.managerNote} ${uploads.length} new vault item${uploads.length > 1 ? "s were" : " was"} added to the room.`,
            };
          }),
        );
      },
      updateTaskStatus(projectId, taskTitle, status) {
        pushEvent({
          projectId,
          title: taskTitle,
          detail: `Task status changed to ${status.toLowerCase()}.`,
          kind: "Task",
          emphasis: status,
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            const updatedTasks = project.tasks.map((task) =>
              task.title === taskTitle ? { ...task, status, blocked: status === "Done" ? false : task.blocked } : task,
            );
            const nextOpenTask = updatedTasks.find((task) => task.status !== "Done");

            return {
              ...project,
              tasks: updatedTasks,
              nextStep:
                status === "Done"
                  ? nextOpenTask?.title ?? "Review the room and queue the next move."
                  : `Move ${taskTitle.toLowerCase()} forward today.`,
              managerNote:
                status === "Done"
                  ? `Task completed: ${taskTitle}. Pocket pushed the next room move to the front.`
                  : `Task updated: ${taskTitle} is now ${status.toLowerCase()}.`,
              priorities:
                status === "Done"
                  ? project.priorities.filter((item) => item !== taskTitle).slice(0, 5)
                  : [taskTitle, ...project.priorities.filter((item) => item !== taskTitle)].slice(0, 5),
            };
          }),
        );
      },
      updateOutreachStatus(projectId, contactName, status) {
        pushEvent({
          projectId,
          title: contactName,
          detail: `Outreach status changed to ${status.toLowerCase()}.`,
          kind: "Outreach",
          emphasis: status,
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              nextStep:
                status === "Sent"
                  ? `Track replies from ${contactName} and queue the next outreach move.`
                  : `Update and send outreach for ${contactName}.`,
              managerNote:
                status === "Sent"
                  ? `Outreach moved live: ${contactName} was sent.`
                  : `Outreach status changed for ${contactName}: ${status}.`,
              priorities: [`Outreach: ${contactName}`, ...project.priorities.filter((item) => item !== `Outreach: ${contactName}`)].slice(0, 5),
              outreach: project.outreach.map((item) =>
                item.name === contactName ? { ...item, status } : item,
              ),
            };
          }),
        );
      },
      addQuickAsset(projectId, assetLabel) {
        pushEvent({
          projectId,
          title: assetLabel,
          detail: "Pocket created a fast vault asset request.",
          kind: "Capture",
          emphasis: "Captured",
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              managerNote: `Pocket saved a vault asset request: ${assetLabel}`,
              assets: [
                {
                  name: `${slugify(assetLabel)}.asset`,
                  type: inferAssetType(assetLabel),
                  status: "Ready",
                },
                ...project.assets,
              ],
              priorities: [`Review ${assetLabel}`, ...project.priorities].slice(0, 5),
            };
          }),
        );
      },
      addQuickContentIdea(projectId, idea) {
        pushEvent({
          projectId,
          title: idea,
          detail: "Pocket saved a new content angle into the room.",
          kind: "Capture",
          emphasis: "Idea",
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              managerNote: `Pocket saved a new content angle: ${idea}`,
              contentIdeas: [idea, ...project.contentIdeas].slice(0, 5),
              nextStep: `Turn "${idea}" into a real rollout move.`,
            };
          }),
        );
      },
      runManagerComposer(projectId, input) {
        const brief = input.brief.trim();

        if (!brief) {
          return;
        }

        pushEvent({
          projectId,
          title: brief.charAt(0).toUpperCase() + brief.slice(1),
          detail: `Manager composer created a ${input.intent.toLowerCase()} output.`,
          kind: "Manager",
          emphasis: input.intent,
        });

        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            const summary = brief.charAt(0).toUpperCase() + brief.slice(1);

            if (input.intent === "Task") {
              return {
                ...project,
                nextStep: summary,
                managerNote: `Manager generated a new execution move: ${summary}`,
                priorities: [summary, ...project.priorities.filter((item) => item !== summary)].slice(0, 5),
                tasks: [
                  {
                    title: summary,
                    status: "To do",
                    lane: "Admin",
                    dueLabel: "Today",
                    energy: "Medium",
                  },
                  ...project.tasks,
                ],
              };
            }

            if (input.intent === "Pitch draft") {
              return {
                ...project,
                nextStep: `Review and send the draft: ${summary}`,
                managerNote: `Manager drafted an outreach angle around: ${summary}`,
                priorities: [`Send draft: ${summary}`, ...project.priorities].slice(0, 5),
                outreach: [
                  {
                    name: summary,
                    type: "Pitch",
                    status: "Draft",
                  },
                  ...project.outreach,
                ],
              };
            }

            if (input.intent === "Content item") {
              return {
                ...project,
                nextStep: `Turn "${summary}" into a posted rollout move.`,
                managerNote: `Manager queued a content move: ${summary}`,
                priorities: [`Ship content: ${summary}`, ...project.priorities].slice(0, 5),
                contentIdeas: [summary, ...project.contentIdeas].slice(0, 6),
              };
            }

            if (input.intent === "Asset") {
              return {
                ...project,
                managerNote: `Manager requested a vault item: ${summary}`,
                missingAssets: project.missingAssets.includes(summary)
                  ? project.missingAssets
                  : [summary, ...project.missingAssets].slice(0, 6),
                priorities: [`Upload or approve: ${summary}`, ...project.priorities].slice(0, 5),
              };
            }

            return {
              ...project,
              managerNote: `Manager reminder saved: ${summary}`,
              nextStep: summary,
              priorities: [summary, ...project.priorities].slice(0, 5),
            };
          }),
        );
      },
      signIn(email) {
        const localName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
        setSignedIn(true);
        if (localName) {
          setProfile((current) => ({
            ...current,
            artistName: current.artistName || localName.replace(/\b\w/g, (char) => char.toUpperCase()),
          }));
        }
      },
      signOut() {
        setSignedIn(false);
        getSupabase().auth.signOut();
      },
      completeOnboarding(input) {
        setProfile({
          artistName: input.artistName,
          role: input.role,
          vibe: input.vibe,
          currentProject: input.currentProject,
          targetWindow: input.targetWindow,
          mainGoal: input.mainGoal,
          managerMode: input.managerMode ?? "Direct mode",
          onboarded: true,
        });
      },
      updateProfile(updates) {
        setProfile((current) => ({
          ...current,
          ...updates,
        }));
      },
      exportPocketData() {
        const snapshot: PocketSnapshot = {
          version: 1,
          exportedAt: new Date().toISOString(),
          profile,
          signedIn,
          projects,
          events,
          moneyEntries,
          songs,
          platformConnections,
        };

        return JSON.stringify(snapshot, null, 2);
      },
      importPocketData(rawSnapshot) {
        try {
          const parsed = JSON.parse(rawSnapshot) as Partial<PocketSnapshot>;

          if (!Array.isArray(parsed.projects) || parsed.projects.length === 0) {
            return { ok: false, message: "Import needs at least one project room." };
          }

          setProjects(parsed.projects);
          setProfile({ ...getDefaultProfile(), ...(parsed.profile ?? {}) });
          setSignedIn(Boolean(parsed.signedIn));
          setEvents(Array.isArray(parsed.events) ? parsed.events : []);
          setMoneyEntries(Array.isArray(parsed.moneyEntries) ? parsed.moneyEntries : seedMoneyEntries);
          setSongs(Array.isArray(parsed.songs) ? parsed.songs : seedSongs);
          setPlatformConnections(Array.isArray(parsed.platformConnections) ? mergeSeedPlatforms(parsed.platformConnections) : seedPlatformConnections);

          return { ok: true, message: "Pocket data imported. Your active room is restored." };
        } catch {
          return { ok: false, message: "Import failed. Paste a valid Pocket Manager JSON export." };
        }
      },
      resetPocketData() {
        setProjects(seedProjects);
        setProfile(getDefaultProfile());
        setSignedIn(false);
        setEvents([]);
        setMoneyEntries(seedMoneyEntries);
        setSongs(seedSongs);
        setPlatformConnections(seedPlatformConnections);
      },
      resolveMissingAsset(projectId, assetName) {
        pushEvent({
          projectId,
          title: assetName,
          detail: "Missing asset was resolved and moved into the room package.",
          kind: "Vault",
          emphasis: "Resolved",
        });
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              missingAssets: project.missingAssets.filter((item) => item !== assetName),
              nextStep: `Use ${assetName.toLowerCase()} to tighten the room package and move the rollout forward.`,
              managerNote: `Missing asset resolved: ${assetName}. Pocket promoted the room package forward.`,
              priorities: [`Use ${assetName}`, ...project.priorities.filter((item) => item !== `Use ${assetName}`)].slice(0, 5),
              assets: [
                ...project.assets,
                {
                  name: `${slugify(assetName)}.asset`,
                  type: inferAssetType(assetName),
                  status: "Ready",
                },
              ],
            };
          }),
        );
      },
      setActiveProject(projectId) {
        setProjects((current) => {
          if (current[0]?.id === projectId) {
            return current;
          }

          const nextActive = current.find((project) => project.id === projectId);

          if (!nextActive) {
            return current;
          }

          return [nextActive, ...current.filter((project) => project.id !== projectId)];
        });
      },
    };
  }, [events, moneyEntries, platformConnections, profile, projects, signedIn, songs]);

  return <PocketContext.Provider value={value}>{children}</PocketContext.Provider>;
}

export function usePocket() {
  const context = useContext(PocketContext);

  if (!context) {
    throw new Error("usePocket must be used within PocketProvider");
  }

  return context;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function inferAssetType(assetName: string) {
  if (/cover|photo|visual/i.test(assetName)) {
    return "Artwork";
  }

  if (/clip|video/i.test(assetName)) {
    return "Video";
  }

  if (/master|audio|wav|version/i.test(assetName)) {
    return "Audio";
  }

  return "Document";
}

function normalizeManagerActionType(actionType: string): ManagerComposerInput["intent"] {
  if (/pitch/i.test(actionType)) {
    return "Pitch draft";
  }

  if (/note|content|voice/i.test(actionType)) {
    return "Content item";
  }

  if (/follow|remind/i.test(actionType)) {
    return "Reminder";
  }

  if (/asset|vault|missing/i.test(actionType)) {
    return "Asset";
  }

  return "Task";
}

function buildStarterRevenueStreams(distributor: string): RevenueStream[] {
  const hasDistributor = distributor !== "Not sure yet" && distributor !== "Not connected";

  return [
    {
      streamType: "streaming",
      label: "Streaming royalties",
      collectionBody: hasDistributor ? distributor : "Distributor",
      status: hasDistributor ? "registered_not_collecting" : "not_registered",
      actualAmount: 0,
      estimatedGap: hasDistributor ? 0 : 25,
      reason: hasDistributor ? "Distributor selected. Statement import is still needed." : "No distributor connection selected.",
      action: hasDistributor ? "Import latest statement" : "Connect distributor",
      rateNote: "Streaming collection needs distributor data before Pocket can show confirmed income.",
    },
    {
      streamType: "digital_performance",
      label: "Digital performance royalties",
      collectionBody: "SoundExchange",
      status: "not_registered",
      actualAmount: 0,
      estimatedGap: 50,
      reason: "Not registered on SoundExchange.",
      action: "Register now",
      rateNote: "Conservative starter estimate. Exact value improves after stream counts or statements are connected.",
    },
    {
      streamType: "performance_royalty",
      label: "Performance royalties (writer)",
      collectionBody: "PRO",
      status: "not_registered",
      actualAmount: 0,
      estimatedGap: 35,
      reason: "Song is not logged with a PRO.",
      action: "Log with PRO",
      rateNote: "Conservative starter estimate. PRO territory and repertoire data refine the number.",
    },
    {
      streamType: "mechanical",
      label: "Mechanical royalties",
      collectionBody: "The MLC",
      status: "not_registered",
      actualAmount: 0,
      estimatedGap: 25,
      reason: "Mechanical collection path is not connected.",
      action: "Connect MLC path",
      rateNote: "Starter estimate until download, stream, and composition metadata are imported.",
    },
    {
      streamType: "youtube",
      label: "YouTube Content ID",
      collectionBody: "YouTube",
      status: "not_registered",
      actualAmount: 0,
      estimatedGap: 20,
      reason: "Master is not claimed for Content ID.",
      action: "Claim Content ID",
      rateNote: "Starter estimate for UGC monetization risk. YouTube analytics refines the number.",
    },
  ];
}

function streamMatchesPlatform(stream: RevenueStream, platform: PlatformConnection) {
  const collectionBody = stream.collectionBody.toLowerCase();
  const platformName = platform.name.toLowerCase();

  if (collectionBody === platformName) {
    return true;
  }

  if (platform.group === "Distributor" && stream.streamType === "streaming") {
    return true;
  }

  if (platform.group === "PRO" && stream.streamType === "performance_royalty") {
    return collectionBody === "pro" || collectionBody === platformName;
  }

  if (platform.id === "soundexchange" && stream.streamType === "digital_performance") {
    return true;
  }

  if (platform.id === "mlc" && stream.streamType === "mechanical") {
    return true;
  }

  if (platform.id === "youtube" && stream.streamType === "youtube") {
    return true;
  }

  return false;
}

function getDefaultProfile(): PocketProfile {
  return {
    artistName: "Badman",
    role: "Independent artist",
    vibe: "Dark cinematic release-first lane",
    currentProject: "Late Nights",
    targetWindow: "Next 30 days",
    mainGoal: "Release on time and stay organized daily.",
    managerMode: "Direct mode",
    onboarded: false,
  };
}

function mergeSeedPlatforms(platforms: PlatformConnection[]) {
  const byId = new Map(platforms.map((platform) => [platform.id, platform]));

  return [
    ...platforms,
    ...seedPlatformConnections.filter((platform) => !byId.has(platform.id)),
  ];
}
