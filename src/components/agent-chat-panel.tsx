export function AgentChatPanel({
  title,
  subtitle,
  companion,
  actions,
}: {
  title: string;
  subtitle?: string;
  companion?: {
    name: string;
    role: string;
    mode: string;
    specialty: string;
    canCarry: string[];
    currentHelp: string;
  };
  actions?: ReadonlyArray<{
    type: string;
    title: string;
    detail: string;
    payload: string;
  }>;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0a0b10] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-4">
        <div className="text-sm font-medium text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-white/55">{subtitle}</div> : null}
      </div>
      <div className="space-y-4 text-sm text-white/70">
        {companion ? (
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-white">{companion.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                  {companion.role} · {companion.mode}
                </div>
              </div>
            </div>
            <div className="mt-3 leading-6 text-white/75">{companion.specialty}</div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-3 text-white/65">
              {companion.currentHelp}
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 p-4">
          Copilot mode is being hardened into a real project-aware manager flow instead of a fragile embedded widget.
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">What it should do next</div>
          <ul className="mt-3 space-y-2 leading-6">
            {(companion?.canCarry ?? [
              "Build from the active project context automatically.",
              "Turn vague ideas into tasks, timelines, and outreach drafts.",
              "Keep mobile capture fast instead of chat-heavy.",
            ]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        {actions?.length ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Action conversion layer</div>
            <div className="mt-3 space-y-3">
              {actions.map((action) => (
                <div key={action.title} className="rounded-2xl border border-white/10 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{action.title}</div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {action.type}
                    </div>
                  </div>
                  <div className="mt-2 text-white/65">{action.detail}</div>
                  <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-3 py-2 text-[12px] text-white/75">
                    {action.payload}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-white/10 px-4 py-4 text-white/55">
          Next implementation target: replace this planning shell with a stable project-context action composer.
        </div>
      </div>
    </div>
  );
}
