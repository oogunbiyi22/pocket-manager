# PayRam Integration Spec — Pocket Manager

**Status:** Design only — nothing built. Drafted 2026-06-16.
**Author intent:** Add PayRam as a crypto pay rail *alongside* Stripe, on two distinct surfaces — **payments-in** (subscriptions) and **payouts-out** (artist royalty disbursement). Stripe stays the default; PayRam is additive.

> Why PayRam: permissionless, non-custodial, self-hosted, supports card-to-crypto, and is not ToS-hostile to the kinds of money movement Stripe restricts. Already the chosen crypto rail elsewhere in the stack, so ops + key management patterns are known.

---

## 0. Current billing architecture (what we're slotting into)

- **Checkout:** `src/app/api/v1/billing/checkout/route.ts` — Stripe dynamic pricing (no price IDs). Plans hardcoded: Pro $9/mo, Elite $29/mo. Auth resolved from Supabase JWT (`getAuthedUser`), never from request body.
- **Webhook:** `src/app/api/stripe/webhook/route.ts` — on `checkout.session.completed` / `customer.subscription.updated/deleted`, updates `profiles.plan` + `profiles.stripe_customer_id`. **The webhook is the only writer of `plan`** (client never self-upgrades). This is the security spine — PayRam must follow the same rule.
- **Profile:** `profiles` table — `plan` (`free|pro|elite`), `stripe_customer_id`. No `email` column (lives in `auth.users`).

**Design principle inherited:** entitlement (`plan`) is mutated *only* by a server-verified provider callback. PayRam plugs in as a second such callback, never as a client write.

---

## 1. Surface A — Payments In (crypto subscription checkout)

### Goal
Let a user pay for Pro/Elite in crypto (or card-to-crypto via PayRam) as an alternative to Stripe. Useful for international indie artists without easy card access.

### Flow
1. Billing page shows existing Stripe button **+ a "Pay with crypto" option**.
2. New route `POST /api/v1/billing/payram/checkout`:
   - Resolve user from JWT (reuse `getAuthedUser`).
   - Create a PayRam payment/invoice for the plan amount (USD-denominated, PayRam handles crypto conversion).
   - Pass `client_reference_id = supabase user id` + `metadata.plan` (mirror the Stripe pattern exactly).
   - Return the PayRam hosted-checkout URL; redirect the user.
3. New webhook `POST /api/payram/webhook`:
   - **Verify the PayRam signature** (HMAC of raw body w/ `PAYRAM_WEBHOOK_SECRET`) — fail closed, same posture as `CRON_SECRET` pattern used elsewhere.
   - On `payment.completed` (or PayRam's equivalent): look up user by `client_reference_id`, set `profiles.plan = metadata.plan`, store `profiles.payram_customer_id` / subscription ref.
   - On expiry/refund/chargeback-equivalent: downgrade to `free`.

### Subscription nuance (the hard part)
Stripe handles recurring billing natively. Crypto rails usually don't auto-charge a recurring card. Options:
- **(a) Recurring via PayRam subscriptions** if PayRam supports it natively → cleanest, mirror Stripe.
- **(b) Time-boxed entitlement** — each payment grants N days of plan; a cron checks expiry and downgrades. Simpler, crypto-native, but requires a renewal nudge UX. **Recommended starting point.**

### Schema additions (`profiles`)
```sql
alter table profiles add column if not exists payram_customer_id text;
alter table profiles add column if not exists plan_source text;        -- 'stripe' | 'payram'
alter table profiles add column if not exists plan_expires_at timestamptz; -- for option (b)
```
`plan_source` prevents a Stripe webhook and a PayRam webhook from fighting over the same row.

### Env
```
PAYRAM_API_KEY=
PAYRAM_WEBHOOK_SECRET=
PAYRAM_BASE_URL=            # self-hosted instance URL
PAYRAM_SUCCESS_URL=         # default success redirect
```

### CSP note
`src/proxy.ts` Content-Security-Policy `connect-src`/`frame-src` must be widened to include the PayRam host (currently only allows stripe/supabase/groq/anthropic/openai). Easy to miss — checkout silently breaks otherwise.

---

## 2. Surface B — Payouts Out (royalty disbursement rail)

### Goal
This is the bigger product play, and it's *on-thesis*: Pocket Manager's whole premise is "close the Gap between what you earn and what you collect." A payout rail lets artists **receive** collected money — especially cross-border, where traditional payout rails (ACH/wire/PayPal) are slow, expensive, or unavailable.

### Where it fits the product
- Today the app *tracks* revenue streams + gaps (read-only intelligence).
- Payouts = the app moves from "tells you what you're owed" → "helps you actually get paid." Natural premium/Elite feature or a revenue-share line.

### Flow (v1, manual-trigger)
1. Artist adds a **PayRam payout address / connects a PayRam account** in settings → store `profiles.payram_payout_address` (encrypted at rest; never expose client-side beyond last 4).
2. When a collection/disbursement is due (e.g. a sync placement pays out, or platform settles), an **operator-initiated** payout:
   - `POST /api/v1/payouts/payram` (server-only, admin/cron auth) → create PayRam payout to the artist's address for amount X.
   - Record in a new `payouts` table (status, amount, tx ref, source stream).
3. Webhook updates payout status `pending → sent → confirmed`; surface in a "Money" event (reuse the existing `PocketEvent` kind `"Money"`).

### Schema (new)
```sql
create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount_usd numeric not null,
  payram_tx_ref text,
  status text not null default 'pending',  -- pending|sent|confirmed|failed
  source text,                              -- which revenue stream / placement
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Hard constraints / open questions
- **KYC / AML / money transmission.** Disbursing money to artists is materially different from collecting subscriptions — it can trigger money-transmitter obligations depending on jurisdiction and whether Pocket Manager is custodial at any point. PayRam being **non-custodial** helps a lot (funds may flow artist↔payer without Pocket Manager holding them), but this needs a real compliance read before build. **Do not ship payouts without that.**
- **Source of funds.** Where does the payout money come from? Three models: (a) pure pass-through (a sync buyer pays the artist directly via a PayRam link the app generates — app never touches funds, lowest risk); (b) app-escrowed (app holds, then disburses — highest risk, likely needs MTL); (c) the artist's own connected accounts settle to their PayRam address. **(a) is the recommended v1** — app stays a routing/intelligence layer, not a custodian.
- **Tax reporting.** Payout records may need 1099-style reporting depending on volume/US-nexus.

---

## 3. Recommended build order

1. **Surface A, option (b)** — crypto subscription checkout w/ time-boxed entitlement. Self-contained, mirrors Stripe, low compliance surface. Ships value + proves the PayRam plumbing.
2. **Surface B, model (a)** — pass-through payout links (app generates a PayRam payment link a buyer/payer uses to pay the artist directly; app records + tracks but never custodies). On-thesis, low custody risk.
3. **Only then** consider escrowed payouts / native recurring — both need legal sign-off.

## 4. Shared infra to build once
- PayRam SDK/client wrapper in `src/lib/payram.ts` (mirror how Stripe is instantiated).
- Signature-verifying webhook helper (fail-closed) — reusable across both surfaces.
- `plan_source` discipline so Stripe and PayRam never clobber each other's `profiles.plan` writes.
- CSP allowlist update in `src/proxy.ts`.

## 5. Explicitly out of scope for v1
- Recurring crypto auto-charge (use time-boxed instead).
- App-custodied escrow (compliance gate).
- Multi-currency payout splits to collaborators (the `song_collaborators` ownership data exists — future: split a payout by ownership %, but that's v2+).
