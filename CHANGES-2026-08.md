# Upgrade pass — 2026-08-11

## Round 2 — landing page redesign + type color fix

**`src/app/page.tsx` — full rebuild.** The marketing landing page was running its own bespoke neon palette (cyan `#00d4ff`, violet `#a855f7`, green `#10f090`, amber `#ffb300`) that didn't match the actual in-app design tokens or even the logo (`#7c6fef` electric violet, real amber `#ef9f27`, real green `#97c459`). First visitors were looking at a different brand than the one inside the product. Rebuilt using the real `globals.css` tokens and utility classes (`.glass`, `.glass-subtle`, `.glass-electric`, `.btn-electric`, `.btn-ghost`, `.label-upper`) instead of one-off inline neon gradients, added scroll-triggered reveal animation (Framer Motion, already a dependency) on every section, went to one confident accent color instead of four competing ones, bigger and more restrained hero type, more generous section spacing throughout. Same real copy and product claims — nothing invented, no fake testimonials or stats added.

**Text color tokens — solid stops instead of alpha washes.** `--text-primary/secondary/muted/dim` were all `rgba(...)` with heavy transparency, which is why body copy read hazy and inconsistent depending on what was behind it. Converted to solid hex stops in the same violet-gray family (`#f5f3ff` / `#a8a6c4` / `#726f92` / `#454363`) — same hierarchy, sharper and more consistent contrast everywhere the tokens are used, which is the entire app. One CSS edit, cascades everywhere.

Both changes verified: `tsc --noEmit` clean, `npm run test` 16/16, dev server compiles and serves 200 with the new values present in the compiled CSS.


Applied against the `pocket-manager-main.zip` snapshot (dated 2026-06-16). Verified with `tsc --noEmit` (clean) and `npm run test` (16/16 passing). Could not run `npm run build` in this sandbox — it fails only on outbound Google Fonts fetches being blocked here, unrelated to any change below; build locally/on Vercel to confirm.

## Done

**Design consistency — unified the accent palette.** `globals.css` defined `--amber: #f0a832` and `--green: #5fcf7e`, but ~24 page files had already drifted onto `#ef9f27` (amber) and `#97c459` (green) — which is what AGENTS.md's own "Design system" section documents as canonical. So roughly half the app was rendering a visibly different amber/green than the other half. Updated the CSS tokens to match the documented values and replaced every literal old-value hex/rgba occurrence across `app/` and `components/` so the whole app now renders one consistent accent palette. This is almost certainly part of what read as "not premium/cohesive" — it's a small color shift but it's everywhere.

**Added a real test suite.** There was no test framework at all on an app now handling live Stripe payments. Added Vitest plus:
- `src/lib/rate-limit.test.ts` — window behavior, per-key isolation, IP parsing.
- `src/app/api/stripe/webhook/route.test.ts` — the important one. Locks in that the webhook fails closed with no `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, rejects forged signatures, resolves the correct user via `client_reference_id` (never a client-supplied field), refuses to upgrade when no user id resolves, and correctly downgrades on `subscription.deleted`/non-active status.

Run with `npm run test`. This won't catch everything, but it means a future refactor of the webhook can't silently break billing without a red test.

**Fixed stale docs in AGENTS.md.** The "AI stack" section said Free/Pro run on Groq with Elite falling back to Groq — the actual code (`api/v1/manager/chat/route.ts`) uses Gemini as the default rail and Claude for Elite, with zero Groq calls anywhere in the codebase. `GROQ_API_KEY`/`@ai-sdk/groq` are both present (env var list, package.json) but genuinely unused — either wire Groq in or drop it, but right now the docs describe a system that isn't the one running. Corrected the doc and added a dated note explaining what changed and why, plus flagged the `pocket-provider.tsx` legacy-model and no-tests items inline so they don't get lost.

## Investigated, deliberately not touched

**`pocket-provider.tsx` legacy `Project` model.** Flagged in your own April notes as something that "should be gradually reduced." I checked whether it's actually dead before touching it — it's not: `app/projects/[projectId]/page.tsx` uses `projects` as a fallback lookup (`getProjectById`) when a song isn't found in the current `songs` catalog. That's almost certainly a compatibility shim for early users whose data predates the V5 song model. Ripping it out blind could orphan real accounts. Left it in place with a note in AGENTS.md on how to verify it's safe to remove (check Supabase for any rows still shaped the old way, migrate if found, then retire).

**Dead component cluster — found but couldn't delete.** `components/ui/demo.tsx`, `splite.tsx`, `spotlight.tsx`, `ai-voice-input.tsx`, `ai-voice-input-demo.tsx` are unreferenced by any real page — leftover 21st.dev scaffold boilerplate. They're the only consumers of `@splinetool/react-spline` + `@splinetool/runtime` (two fairly heavy 3D libraries pulled into your install for nothing). This sandbox's filesystem wouldn't let me `rm` or `unlink` these files (permission error on delete specifically, not on edit), so I couldn't complete the removal — you'll need to run this yourself:
```
git rm src/components/ui/demo.tsx src/components/ui/splite.tsx src/components/ui/spotlight.tsx src/components/ui/ai-voice-input.tsx src/components/ui/ai-voice-input-demo.tsx
npm uninstall @splinetool/react-spline @splinetool/runtime
```
Safe, mechanical, zero functional risk — nothing in the live app imports them.

## Feature-depth audit (what's real vs. thin, sampled honestly)

- **Contracts scanner** — real. Rule-based clause detection (`scanContract()` in `pocket-brain.ts`), validated + rate-limited API route. Deliberately not LLM-based, by design, not by gap.
- **Valuation** — real computation from live catalog data, honestly labeled "directional benchmark, not an official appraisal."
- **Royalty statement reader** — real. Correct per-distributor column mapping for DistroKid/TuneCore/CD Baby/ASCAP/BMI/SoundExchange, anomaly detection, appropriately uses session-scoped (not permanent) storage since it's a paste-and-analyze flow.
- **Beat Licensing Manager** — the one genuinely thin one. `app/beats/page.tsx` is plain `useState`, not wired to Supabase — there's no `beat_licenses`-type table in your schema. Entered license data doesn't survive a refresh or another device. If this is a feature you actually want live, it needs a migration + API route like the other modules got; right now it's the one screen still at pre-V5 persistence.

## Cost audit — mostly already good, one real lever

Went in expecting to find spend leaks and mostly didn't:
- AI model routing is already cost-disciplined: Gemini Flash (cheap) for Free/Pro, Claude only for Elite, both gated by plan — correct shape.
- 14 of 14 third-party music-API proxy routes (Deezer, Genius, MusicBrainz, LastFM, etc.) already have in-memory caching with sane TTLs.
- AI Mastering (the genuinely expensive one) is rate-limited to 5/hour with an explicit "mastering is expensive" comment. Genrenator, pitch send, everything else is rate-limited too.
- The one real lever: `lib/rate-limit.ts` is in-memory per-warm-instance, which is fine at low volume but won't hold a consistent limit across multiple concurrent Vercel instances once traffic grows — the file already documents this ("replace the store with Upstash Redis"). Not a cost bug today, but worth doing before a traffic spike, since a blown-out AI Mastering or chat rate limit under multi-instance scaling is the one path to a real bill spike.
- Biggest actual cost lever isn't in the code — it's your Vercel/Supabase plan tier and which optional API keys you've provisioned (Songstats, AI Mastering, Resend all cost money once wired for real; several currently degrade gracefully if unset, which is the right default).

## Still open (from the last audit, unchanged — these need your action, not code)

- Confirm `STRIPE_WEBHOOK_SECRET` is actually set in Vercel prod (webhook fails closed without it).
- Run one real Stripe checkout end-to-end in production.
- Real mobile device QA pass.
- Decide on `RESEND_API_KEY` vs. mailto fallback for pitch sending (Signal/Pocket A&R is a headline feature — mailto is a weak version of it).
