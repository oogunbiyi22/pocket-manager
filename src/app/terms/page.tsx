import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080810] px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/sign-in" className="text-xs text-white/50 hover:text-white/90 transition">← Back</Link>

        <div className="mt-8 overflow-hidden rounded-[24px] border-[0.5px] border-white/[0.08] bg-[#141412]">
          <div className="bg-[#0d0d0b] px-8 py-8 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Pocket Manager</div>
            <h1 className="mt-3 text-3xl font-light tracking-tight">Terms of Service</h1>
            <p className="mt-2 text-sm text-white/45">Last updated: April 2026</p>
          </div>

          <div className="space-y-8 px-8 py-8 text-sm leading-7 text-white/60">
            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">1. Acceptance of Terms</h2>
              <p>By accessing or using Pocket Manager (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">2. Description of Service</h2>
              <p>Pocket Manager is a music creator revenue intelligence platform that helps independent artists track royalties, manage their catalog, and identify uncollected revenue. We provide tools for catalog management, revenue gap analysis, and release planning.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">3. Your Account</h2>
              <p>You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to use the Service. You agree to provide accurate information when creating your account.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">4. Your Content</h2>
              <p>You retain ownership of all music catalog data, metadata, and content you upload to Pocket Manager. By using the Service, you grant us a limited license to store and process your data solely to provide the Service to you.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">5. Billing & Subscriptions</h2>
              <p>Free tier access is provided at no cost. Pro and Elite plans are billed monthly or annually as displayed at checkout. You may cancel at any time. Refunds are handled on a case-by-case basis — contact support within 7 days of a charge if you have an issue.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">6. Prohibited Uses</h2>
              <p>You may not use the Service to violate any laws, infringe on intellectual property rights, attempt to reverse engineer the platform, or submit false or misleading catalog data.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">7. Disclaimers</h2>
              <p>Revenue gap estimates provided by Pocket Manager are projections based on catalog metadata and industry benchmarks. They are not guarantees of actual earnings. Always verify with your distributors and PROs directly.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">8. Limitation of Liability</h2>
              <p>Pocket Manager is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the past 12 months.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">9. Changes to Terms</h2>
              <p>We may update these terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the new terms. We will notify users of material changes via email.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-white/80">10. Contact</h2>
              <p>Questions about these terms? Email us at <a href="mailto:support@pocketmanager.online" className="text-white/80 underline underline-offset-2">support@pocketmanager.online</a>.</p>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>
          {" · "}
          <Link href="/sign-in" className="underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
