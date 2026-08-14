import type { Metadata } from "next";
import { SignIn, ShieldCheck } from "@phosphor-icons/react/ssr";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  TextLink,
} from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to the TruHu application.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <Section tone="section" size="loose">
      <Container className="max-w-xl!">
        <Card className="p-8 sm:p-10">
          <Eyebrow>For brokerage and employer teams</Eyebrow>
          <h1 className="t-h1 mt-4">Sign in to TruHu</h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-grey-700">
            The application lives on a separate host. SSO is available for firms
            with an identity provider, and enforced MFA for everyone else.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CTAButton href="https://app.truhu.ai">
              <SignIn weight="bold" className="size-4" aria-hidden />
              Continue to the app
            </CTAButton>
            <CTAButton href="/contact" variant="secondary">
              I need access
            </CTAButton>
          </div>

          <div className="mt-10 flex gap-3 border-t border-border-200 pt-6">
            <ShieldCheck weight="fill" className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden />
            <p className="text-[0.9375rem] leading-relaxed text-grey-700">
              Employees never sign in. There is no employee account and no
              credential to phish, which is a security property as much as a
              usability one.{" "}
              <TextLink href="/security">How access control works</TextLink>
            </p>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
