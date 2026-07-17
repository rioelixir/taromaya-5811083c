import { createFileRoute, Link } from "@tanstack/react-router";
import { StarField } from "@/components/star-field";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions — TAROMAYA" },
      { name: "description", content: "The Terms and Conditions governing your use of TAROMAYA." },
    ],
  }),
});

function TermsPage() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      <StarField />
      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-pearl"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="mt-6 font-display text-4xl gold-text">Terms & Conditions</h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Last updated · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        <div className="mt-8 glass rounded-3xl p-6 sm:p-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Acceptance of Terms">
            By creating an account or using TAROMAYA ("the App"), you confirm that you have read,
            understood, and agree to be bound by these Terms & Conditions. If you do not agree,
            you may not use the App.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 18 years of age (or the age of majority in your jurisdiction) to
            create an account. By registering, you represent that all information you provide is
            accurate and truthful.
          </Section>

          <Section title="3. Nature of Content">
            TAROMAYA offers tarot readings, Vedic astrology, kundli, panchang, numerology, and
            related content for entertainment, self-reflection, and spiritual guidance. It is not a
            substitute for professional medical, legal, financial, or psychological advice.
          </Section>

          <Section title="4. Account & Security">
            You are responsible for maintaining the confidentiality of your credentials and for all
            activity under your account. Notify us immediately of any unauthorized access.
          </Section>

          <Section title="5. Subscriptions & Payments">
            Premium features require an active subscription. Pricing is set by the administrators
            and may change from time to time. Subscriptions are non-transferable and, unless
            required by law, non-refundable.
          </Section>

          <Section title="6. Acceptable Use">
            You agree not to misuse the App, attempt to reverse engineer any part of it, share
            account credentials, or use it for unlawful purposes. We may suspend or terminate
            accounts that violate these terms.
          </Section>

          <Section title="7. Intellectual Property">
            All content, designs, artwork, and code within TAROMAYA are the property of TAROMAYA
            and its licensors. You may not reproduce or redistribute any part without written
            permission.
          </Section>

          <Section title="8. Privacy">
            We collect and process your data as described in our Privacy Policy. Birth details are
            used solely to generate your personalised charts and readings.
          </Section>

          <Section title="9. Disclaimer of Warranties">
            The App is provided "as is" without warranties of any kind. Astrological and tarot
            interpretations are symbolic in nature; outcomes are not guaranteed.
          </Section>

          <Section title="10. Limitation of Liability">
            To the fullest extent permitted by law, TAROMAYA shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the App.
          </Section>

          <Section title="11. Changes to Terms">
            We may update these Terms from time to time. Continued use of the App after changes
            constitutes acceptance of the updated Terms.
          </Section>

          <Section title="12. Contact">
            Questions about these Terms? Reach us at taromayaexperts@gmail.com.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg text-pearl">{title}</h2>
      <p className="mt-2">{children}</p>
    </div>
  );
}
