import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruHu · Funnel analytics",
  description: "Live funnel analytics for the TruHu get-started page.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
