import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruHu · /BryanKleppe",
  description: "Live analytics for /BryanKleppe: Bryan's paths, sources, leads, bookings and calls.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
