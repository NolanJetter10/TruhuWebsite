import type { Metadata } from "next";
import { ViewTransition } from "react";
import { DM_Sans, Inter } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SITE } from "@/lib/site";
import "./globals.css";

/** DM Sans display, Inter body. Self-hosted, so no third-party request. */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "TruHu, the work your best accounts get, for your whole book",
    template: "%s · TruHu",
  },
  description: SITE.tagline,
  openGraph: { type: "website", siteName: SITE.name, locale: "en_US", url: SITE.url },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        {/*
          React's <ViewTransition> turns every route change into a real
          document transition. The CSS in globals.css decides what it looks
          like: a short crossfade, with the header anchored so it does not
          travel with the page.
        */}
        <ViewTransition>
          <main id="main">{children}</main>
        </ViewTransition>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE.name,
              legalName: SITE.legalName,
              url: SITE.url,
              description: SITE.tagline,
            }),
          }}
        />
      </body>
    </html>
  );
}
