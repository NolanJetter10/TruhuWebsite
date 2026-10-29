/**
 * Headers for the Ensemble MCP server in .mcp.json. Claude Code runs this
 * before it connects and sends the JSON it prints, so the key lives in
 * .env.local (git-ignored) and never in .mcp.json.
 *
 *   ENSEMBLE_API_KEY=sk_...      Ensemble web app → API Keys → Create
 *   ENSEMBLE_TENANT_ID=...       the tenant that owns the Truhu agent
 *
 * No dependencies. Runs from any directory.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value.replace(/^(["'])(.*)\1$/, "$2")]),
    );
  } catch {
    return {};
  }
}

const env = { ...readEnvFile(join(root, ".env.local")), ...process.env };
const apiKey = env.ENSEMBLE_API_KEY;
const tenantId = env.ENSEMBLE_TENANT_ID;

if (!apiKey || !tenantId) {
  console.error("Set ENSEMBLE_API_KEY and ENSEMBLE_TENANT_ID in .env.local");
  process.exit(1);
}

// Not Authorization: Bearer. The server reads that as a session token and
// rejects the API key with "Invalid or expired token".
console.log(JSON.stringify({ "x-api-key": apiKey, "x-tenant-id": tenantId }));
