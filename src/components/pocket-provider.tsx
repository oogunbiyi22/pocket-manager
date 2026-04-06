"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Project, seedProjects } from "@/lib/backstage-data";
import { TaskStatus } from "@/lib/backstage-data";

const PROJECTS_STORAGE_KEY = "pocket-manager-projects";
const PROFILE_STORAGE_KEY = "pocket-manager-profile";
const SESSION_STORAGE_KEY = "pocket-manager-session";

type CreateProjectInput = {
  name: string;
  type: string;
  vibe: string;
  stage: string;
  targetDate: string;
  goal: string;
};

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

type ManagerComposerInput = {
  intent: "Task" | "Pitch draft" | "Content item" | "Reminder" | "Asset";
  brief: string;
};

type PocketProfile = ProfileInput & {
  onboarded: boolean;
};

type PocketContextValue = {
  projects: Project[];
  activeProject: Project;
  profile: PocketProfile;
  signedIn: boolean;
  createProject: (input: CreateProjectInput) => void;
  convertManagerAction: (projectId: string, actionType: string) => void;
  updateTaskStatus: (projectId: string, taskTitle: string, status: TaskStatus) => void;
  updateOutreachStatus: (projectId: string, contactName: string, status: string) => void;
  addTask: (projectId: string, input: AddTaskInput) => void;
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
  resolveMissingAsset: (projectId: string, assetName: string) => void;
  setActiveProject: (projectId: string) => void;
};

const PocketContext = createContext<PocketContextValue | null>(null);

export function PocketProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window === "undefined") {
      return seedProjects;
    }

    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);

    if (!raw) {
      return seedProjects;
    }

    try {
      const parsed = JSON.parse(raw) as Project[];
      return Array.isArray(parsed) && parsed.length ? parsed : seedProjects;
    } catch {
      window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
      return seedProjects;
    }
  });
  const [profile, setProfile] = useState<PocketProfile>(() => {
    if (typeof window === "undefined") {
      return getDefaultProfile();
    }

    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!raw) {
      return getDefaultProfile();
    }

    try {
      return { ...getDefaultProfile(), ...(JSON.parse(raw) as Partial<PocketProfile>) };
    } catch {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      return getDefaultProfile();
    }
  });
  const [signedIn, setSignedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SESSION_STORAGE_KEY) === "signed-in";
  });

  useEffect(() => {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, signedIn ? "signed-in" : "signed-out");
  }, [signedIn]);

  const value = useMemo<PocketContextValue>(() => {
    const activeProject = projects[0] ?? seedProjects[0];

    return {
      projects,
      activeProject,
      profile,
      signedIn,
      createProject(input) {
        const projectId = slugify(input.name);

        setProjects((current) => [
          {
            id: projectId,
            name: input.name,
            type: input.type,
            stage: input.stage,
            daysLeft: 28,
            goal: input.goal,
            health: "New room",
            summary: `${input.type} workspace shaped around ${input.vibe.toLowerCase()} with a ${input.stage.toLowerCase()} starting posture and a ${input.targetDate.toLowerCase()} target window.`,
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
      },
      convertManagerAction(projectId, actionType) {
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            if (actionType === "Task") {
              return {
                ...project,
                nextStep: `Finish manager follow-through for ${project.nextStep.toLowerCase()}`,
                managerNote: `Manager converted the room into a task lane: ${project.nextStep}`,
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

            if (actionType === "Pitch draft") {
              return {
                ...project,
                nextStep: `Review and send the draft for ${project.outreach[0]?.name ?? project.name}`,
                managerNote: `Manager opened an outreach draft lane for ${project.name}.`,
                priorities: [`Send outreach draft`, ...project.priorities].slice(0, 5),
                outreach: project.outreach.map((item, index) =>
                  index === 0 ? { ...item, status: "Draft" } : item,
                ),
              };
            }

            if (actionType === "Content item") {
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

            if (actionType === "Reminder") {
              return {
                ...project,
                nextStep: "Check the saved follow-up and keep the room moving today.",
                managerNote: `${project.managerNote} Follow-up timing was saved so the room does not lose momentum.`,
                priorities: [`Check saved follow-up timing`, ...project.priorities].slice(0, 5),
              };
            }

            return project;
          }),
        );
      },
      addTask(projectId, input) {
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
      addAsset(projectId, input) {
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
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              managerNote: `Captured a fast vault placeholder: ${assetLabel}`,
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
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,
              managerNote: `Captured a new content angle: ${idea}`,
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
      resolveMissingAsset(projectId, assetName) {
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
          const nextActive = current.find((project) => project.id === projectId);

          if (!nextActive) {
            return current;
          }

          return [nextActive, ...current.filter((project) => project.id !== projectId)];
        });
      },
    };
  }, [profile, projects, signedIn]);

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
