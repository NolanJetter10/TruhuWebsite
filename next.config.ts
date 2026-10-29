import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The booking page was /get-started. Campaign links and the reschedule and
      // cancel links in confirmation emails already sent still point there; the
      // query string (UTM tags, booking id) and the #calendar hash carry over.
      { source: "/get-started/:path*", destination: "/BryanKleppe/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
