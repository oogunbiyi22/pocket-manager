"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getActiveRoomSummary } from "@/lib/backstage-data";

const benefits = [
  "Open your desktop overview and review room health.",
  "Jump into the mobile route when you need the full in-pocket workflow.",
  "Keep sign-in light while the mobile product does the heavy daily lifting.",
];

const productTruths = [
  "This system is for readiness, momentum, and decisions, not just stored tasks.",
  "Desktop should get you in fast and hand off cleanly to the stronger mobile flow.",
  "The manager brain should already know what is missing, risky, and worth pushing.",
];

export default function SignInPage() {
  const router = useRouter();
  const { activeProject, profile, signIn, signedIn } = usePocket();
  const [email, setEmail] = useState("artist@pocketmanager.app");
  const [password, setPassword] = useState("");
  const activeRoom = getActiveRoomSummary(activeProject);

  return (
    <AppShell title="Sign in" eyebrow="Desktop access">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="Pocket Manager access"
          description="This desktop surface should get you into the system quickly without pretending the browser is the full product."
        >
          <div className="space-y-4">
            <label className="block text-sm text-white/70">
              <span className="mb-2 block">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition focus:border-emerald-300/25"
              />
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-2 block">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/25"
              />
            </label>

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4 text-sm text-white/75">
              {signedIn
                ? `Signed in as ${profile.artistName}.`
                : "Local desktop access is enabled for this MVP. Sign-in state persists on this device."}
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  signIn(email);
                  router.push("/dashboard");
                }}
                className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-emerald-200"
              >
                Enter desktop overview
              </button>
              <Link
                href="/onboarding"
                className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-5 py-3 text-emerald-100 transition hover:border-emerald-300/35"
              >
                Open onboarding
              </Link>
              <Link
                href="/mobile"
                className="rounded-full border border-white/15 px-5 py-3 text-white/85 transition hover:border-white/30 hover:text-white"
              >
                Go to mobile preview
              </Link>
            </div>
          </div>
        </Panel>

        <Panel title="What desktop is for" description="Keep the browser useful, but not overloaded.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4 text-sm text-white/75">
              <div className="font-medium text-white">{activeRoom.name}</div>
              <div className="mt-2 leading-6 text-white/70">
                {activeRoom.state} · {activeRoom.readiness}% ready · {activeRoom.pressure}
              </div>
              <div className="mt-2 text-white/60">{activeRoom.nextMove}</div>
            </div>

            <ul className="space-y-3 text-sm text-white/70">
              {benefits.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 leading-6">
                  {item}
                </li>
              ))}
            </ul>

            <div className="space-y-3 text-sm text-white/70">
              {productTruths.map((item) => (
                <div key={item} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4 leading-6">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
