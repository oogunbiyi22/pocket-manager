<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Backstage / Pocket Manager agent rules

Also follow `../BADMAN-BUILD-BOARD-RULES.md`.

Project-specific reminders:
- Think before coding. Do not guess product intent when hierarchy, UX, or flow is ambiguous.
- Simplicity first. Build the minimum believable premium solution.
- Make surgical edits. Do not drift into unrelated cleanup.
- Define success before bigger changes and verify with the lightest real check.

Pocket Manager filter:
- reduce clutter, not intelligence
- avoid generic SaaS energy
- protect premium feel and sellability
- every meaningful change should improve clarity, demo quality, speed, or artist usefulness

---

## Current build status (as of June 2026)

**App:** Pocket Manager — AI music manager for independent artists
**Live:** https://pocketmanager.online
**GitHub:** https://github.com/oogunbiyi22/pocket-manager
**Stack:** Next.js 16, React 19, Tailwind 4, TypeScript, Supabase, Stripe, Groq

### Production env vars (.env.local has all of these — also add to Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `GROQ_API_KEY` ✓
- `STRIPE_SECRET_KEY` ✓ (live key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ✓ (live key)
- `STRIPE_WEBHOOK_SECRET` — PENDING (create webhook in Stripe dashboard → Developers → Webhooks → endpoint: https://pocketmanager.online/api/stripe/webhook, events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)

### Supabase
- Project: cplxcbjljgdmrjyojkpb.supabase.co
- Run `supabase/MASTER_RUNME.sql` in Supabase SQL Editor if tables don't exist yet (safe to re-run)
- Tables: profiles, user_catalogs, user_workspace_state, waitlist, venues, radio_stations, sync_companies, user_venue_pitches, user_radio_submissions, user_sync_pitches, user_playlist_pitches, blog_posts, user_notifications
- Storage bucket: vault-assets (private, 50MB limit)

### AI stack
- **CORRECTED 2026-08 — this section was stale and didn't match the code.**
- Free/Pro users: Google Gemini (`gemini-2.0-flash` by default, via `@ai-sdk/google`)
- Elite users: Anthropic Claude (`claude-sonnet-4-6`) when `ANTHROPIC_API_KEY` is set, else falls back to `gemini-1.5-pro` — NOT Groq
- Test rail: if `OPENROUTER_API_KEY` is set, ALL chat routes through OpenRouter instead (see `selectModel()`)
- Model selection + streaming chat logic lives in `src/app/api/v1/manager/chat/route.ts` (`selectModel`, `buildSystemPrompt`)
- `src/lib/pocket-brain.ts` is a separate, self-contained rule-based intent/response engine (regex intent detection, no LLM call, no API key needed) — used for deterministic fallback behavior, not the primary chat path
- `GROQ_API_KEY` appears in `.env.local`/Vercel per this doc but is not read by any route in this codebase (only referenced in the CSP allowlist in `src/proxy.ts`) — either wire it into `selectModel()` as a real rail or drop it from the env var list so it doesn't imply capability that doesn't exist

### Stripe billing
- Checkout uses dynamic pricing (no price IDs needed — created on the fly)
- Plans: Free / Pro $9/mo (7-day trial) / Elite $29/mo
- Webhook handler: `src/app/api/stripe/webhook/route.ts`
- After checkout, webhook updates `profiles.plan` and `profiles.stripe_customer_id`

### Known remaining tasks
- Add STRIPE_WEBHOOK_SECRET to Vercel once webhook endpoint is created in Stripe dashboard
- QA on real mobile device
- Test Stripe checkout end-to-end in production
- Optional: add RESEND_API_KEY (resend.com) for real email pitch sending — falls back to mailto without it

### Design system
- Electric Noir dark theme throughout
- Primary accent: #7c6fef (electric purple)
- Success: #97c459, Warning: #ef9f27, Error: #f05c5c
- No bg-white, no text-[#111], no border-black anywhere
- These values are now the canonical `--amber`/`--green` tokens in `globals.css` (fixed 2026-08 — the CSS custom properties had drifted to old values `#f0a832`/`#5fcf7e` while ~24 page files had already moved on to the values documented here, so roughly half the app was rendering a visibly different amber/green than the other half; unified to this doc's values everywhere)

### Known architectural debt (found 2026-08, not yet resolved)
- `pocket-provider.tsx` still carries a legacy `Project`/`projects`/`createProject`/`activeProject` model from the pre-V5 room era. It is NOT dead — `app/projects/[projectId]/page.tsx` uses `projects` as a fallback lookup (`getProjectById`) when a song isn't found in the new `songs` catalog. Likely exists to not orphan any early users whose data is still in the old shape. Before removing: confirm whether any real user profiles still resolve through this fallback (check Supabase `user_workspace_state`/`user_catalogs` for legacy-shaped rows), write a one-time migration if so, then retire.
- No automated test suite (no Jest/Vitest/Playwright) despite the app now handling live Stripe payments and Supabase auth. Highest-risk untested paths: `api/stripe/webhook`, `api/v1/billing/checkout`, `proxy.ts` auth gating, `lib/rate-limit.ts`.
