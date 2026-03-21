import { AppShell, Panel } from "@/components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" eyebrow="Profile, billing, and preferences">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile and plans" description="Account, subscription tier, and artist defaults will live here.">
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 px-4 py-3">Current plan placeholder</div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">Artist profile preferences</div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">Genre, goals, and budget defaults</div>
          </div>
        </Panel>

        <Panel title="Manager preferences" description="This area will control assistant style, reminders, and system behavior.">
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 px-4 py-3">Reminder settings</div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">Manager tone presets</div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">Future billing and workspace controls</div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
