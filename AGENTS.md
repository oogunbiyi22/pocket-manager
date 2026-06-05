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
- Free users: Groq llama-3.3-70b-versatile
- Pro users: Groq (same)
- Elite users: Anthropic Claude (ANTHROPIC_API_KEY optional, falls back to Groq)
- All AI logic in `src/lib/pocket-brain.ts` and `src/app/api/v1/manager/chat/route.ts`

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
