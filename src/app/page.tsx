import Link from "next/link";

const features = [
  {
    title: "Backstage Manager",
    copy: "A motivating career manager that helps artists think clearly, move faster, and make better decisions.",
  },
  {
    title: "Backstage Vault",
    copy: "Project storage and backup for songs, artwork, videos, lyrics, and every asset tied to a release.",
  },
  {
    title: "Pocket A&R",
    copy: "Pitching help, outreach guidance, and promo planning so the music actually leaves the hard drive.",
  },
  {
    title: "Smart Recommendations",
    copy: "Practical next steps, budget direction, and release support based on what the artist actually needs.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
              Backstage
            </div>
            <div className="mt-2 text-lg font-medium text-white/90">
              The support system independent artists never had.
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/15 px-5 py-3 text-white/80 transition hover:border-white/30 hover:text-white"
            >
              View app shell
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-emerald-200"
            >
              Start free
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <div className="mb-4 text-xs uppercase tracking-[0.35em] text-emerald-300/80">
              Pocket manager • vault • promo engine
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Everything around the music, so the artist can stay in the music.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
              Backstage helps independent artists handle planning, storage, pitching, budget decisions, and career momentum without carrying the whole business side alone.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="rounded-full bg-emerald-400 px-6 py-4 font-medium text-black transition hover:bg-emerald-300"
              >
                Open product shell
              </Link>
              <Link
                href="/projects/new"
                className="rounded-full border border-white/15 px-6 py-4 font-medium text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Create sample project
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="rounded-[1.75rem] border border-emerald-300/15 bg-[#0d0f16] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
                    Manager check-in
                  </div>
                  <div className="mt-2 text-2xl font-medium">Late Nights</div>
                </div>
                <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs text-emerald-200">
                  Release in 12 days
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
                <p>
                  Your visuals are missing. Lock cover art and upload a teaser clip before you start playlist outreach.
                </p>
                <p>
                  Budget move: keep promo lean, put energy into one strong visual and five rollout posts.
                </p>
                <p>
                  Backstage Vault has 7 assets ready. Two tasks are overdue.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 pb-16 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-medium text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/60">{feature.copy}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
