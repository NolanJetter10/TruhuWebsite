import path from "node:path";
import type { NextConfig } from "next";

// This app lives inside the website's repo for now, so there are two lockfiles
// above it. Pin its root to this folder so Next never reaches up into the
// website's node_modules or tries to trace files from there.
const root = path.resolve(".");

const nextConfig: NextConfig = {
  turbopack: { root },
  outputFileTracingRoot: root,
  poweredByHeader: false,
};

export default nextConfig;
