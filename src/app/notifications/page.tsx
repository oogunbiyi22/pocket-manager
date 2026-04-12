"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";

const STORAGE_KEY = "pocket-manager-notification-preferences";

type NotificationPreference = {
  id: string;
  label: string;
  tier: "Free" | "Pro" | "Elite";
  description: string;
  enabled: boolean;
};

const defaultPreferences: NotificationPreference[] = [
  {
    id: "gap-alerts",
    label: "New gap detected",
    tier: "Free",
    description: "Tell me when a song has a new missing registration or uncollected revenue path.",
    enabled: true,
  },
  {
    id: "release-radar",
    label: "Release Radar checkpoint",
    tier: "Free",
    description: "Remind me when a release needs a registration, metadata, promo, or final platform check.",
    enabled: true,
  },
  {
    id: "platform-disconnected",
    label: "Platform disconnected",
    tier: "Pro",
    description: "Warn me when a connected distributor, PRO, analytics, or Content ID path needs attention.",
    enabled: true,
  },
  {
    id: "weekly-summary",
    label: "Weekly income summary",
    tier: "Pro",
    description: "Send a calm weekly recap of confirmed income, estimated gaps, and closed actions.",
    enabled: false,
  },
  {
    id: "statement-ready",
    label: "Statement ready to review",
    tier: "Pro",
    description: "Notify me when a royalty statement has been parsed and attached to my catalog.",
    enabled: true,
  },
  {
    id: "promo-posted",
    label: "Promo asset posted",
    tier: "Pro",
    description: "Confirm when a scheduled Promo Studio asset posts or fails through Buffer.",
    enabled: false,
  },
  {
    id: "accountant-export",
    label: "Accountant report sent",
    tier: "Elite",
    description: "Confirm quarterly financial exports sent to my accountant.",
    enabled: false,
  },
];

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const enabledCount = useMemo(() => preferences.filter((item) => item.enabled).length, [preferences]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  function togglePreference(id: string) {
    setPreferences((current) => current.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  }

  return (
    <AppShell title="Notifications" eyebrow="Phase 8 control">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Push intelligence</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Only alerts that move the catalog forward.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Preferences are saved locally in this prototype. Real delivery requires the V5 Expo Notifications, backend job queue, and push token work.
          </p>
          <div className="mt-4 inline-flex rounded-full border-[0.5px] border-white/15 px-3 py-1 text-xs text-white/60">
            {enabledCount} alerts enabled
          </div>
        </section>

        <section className="mt-5 space-y-3">
          {preferences.map((item) => (
            <article key={item.id} className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-medium text-[#111]">{item.label}</h3>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${tierClass(item.tier)}`}>{item.tier}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#514d47]">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePreference(item.id)}
                  className={`min-w-20 rounded-lg px-3 py-2 text-sm ${item.enabled ? "bg-[#0a0a0a] text-white" : "border-[0.5px] border-black/15 text-[#111]"}`}
                >
                  {item.enabled ? "On" : "Off"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}

function tierClass(tier: NotificationPreference["tier"]) {
  if (tier === "Free") {
    return "bg-[#eaf3de] text-[#3b6d11]";
  }

  if (tier === "Pro") {
    return "bg-[#e6f1fb] text-[#185fa5]";
  }

  return "bg-[#faeeda] text-[#854f0b]";
}

function loadPreferences() {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(raw) as NotificationPreference[];
    return defaultPreferences.map((item) => ({
      ...item,
      enabled: parsed.find((saved) => saved.id === item.id)?.enabled ?? item.enabled,
    }));
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return defaultPreferences;
  }
}
