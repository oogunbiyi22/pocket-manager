import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080810] px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/sign-in" className="text-xs text-white/50 hover:text-white/90 transition">← Back</Link>

        <div className="mt-8 overflow-hidden rounded-[24px] border-[0.5px] border-white/[0.08] bg-[#141412]">
          <div className="bg-[#0d0d0b] px-8 py-8 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Pocket Manager</div>
            <h1 className="mt-3 text-3xl font-light tracking-tight">Privacy Policy</h1>
            <p className="mt-2 text-sm text-white/45">Last updated: April 2026</p>
          </div>

          <div className="space-y-8 px-8 py-8 text-sm leading-7 text-white/60">
            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">1. What We Collect</h2>
              <p>We collect information you provide directly: your email, artist name, catalog metadata (song titles, ISRCs, release dates, distributor info), and any notes you add within the app. We also collect basic usage data (pages visited, features used) to improve the product.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">2. How We Use Your Data</h2>
              <p>Your data is used exclusively to provide the Pocket Manager service — calculating revenue gaps, generating next-action recommendations, and powering the A chat assistant. We do not sell your data to third parties. Ever.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">3. AI Processing</h2>
              <p>The A assistant uses your catalog metadata to provide context-aware recommendations. On the Free and Pro plans, queries are processed by Google&apos;s Gemini API. On the Elite plan, queries may be processed by Anthropic&apos;s Claude API. Your catalog data is sent with queries but is not stored by these third-party providers beyond the scope of individual requests.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">4. Data Storage</h2>
              <p>Your data is stored in Supabase (PostgreSQL), hosted in secure US-based data centers with encryption at rest and in transit. Authentication is handled by Supabase Auth with industry-standard security practices.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">5. Third-Party Services</h2>
              <p>We use the following third-party services: Supabase (database and auth), Stripe (payment processing — they never share your full card details with us), Google and Anthropic (AI processing), and Vercel (hosting). Each has their own privacy policy.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">6. Your Rights</h2>
              <p>You can export all your data at any time from the Settings page. You can request deletion of your account and all associated data by emailing us. We will process deletion requests within 30 days.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">7. Cookies</h2>
              <p>We use session cookies for authentication only. We do not use advertising or tracking cookies. You can disable cookies in your browser, but this will prevent you from staying logged in.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">8. Children</h2>
              <p>Pocket Manager is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us information, contact us immediately.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">9. Contact</h2>
              <p>Privacy questions or data requests: <a href="mailto:privacy@pocketmanager.online" className="text-white/80 underline underline-offset-2">privacy@pocketmanager.online</a>.</p>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          <Link href="/terms" className="underline underline-offset-2">Terms of Service</Link>
          {" · "}
          <Link href="/sign-in" className="underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
