import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A separate app with its own lint setup, headed for its own repo.
    "analytics dashboard/**",
    // Copied as-is from benefits-guides (the flipbook viewer and pdf.js).
    "public/flipbook/**",
  ]),
]);

export default eslintConfig;
