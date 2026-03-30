import Link from "next/link";
import { AppShell, Panel } from "@/components/app-shell";

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
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white/40">
                artist@pocketmanager.app
              </div>
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-2 block">Password</span>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white/40">
                Enter password
              </div>
            </label>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/dashboard"
                className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-emerald-200"
              >
                Enter desktop overview
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
