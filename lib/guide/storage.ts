import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { hostResolves } from "@/lib/reachable";

/**
 * Where the files for a guide go: the private `guide-uploads` bucket in
 * Supabase Storage, over plain REST calls with the same SUPABASE_URL and
 * SUPABASE_SECRET_KEY as the analytics store (lib/analytics/store.ts).
 *
 * Files travel from the browser straight to the bucket on signed upload
 * links, so they never pass through this server, whose functions accept at
 * most 4.5 MB a request on Vercel. The team's email links each file for seven
 * days. The bucket itself is made by `analytics dashboard/supabase/schema.sql`.
 *
 * Without Supabase, in development, the browser PUTs each file to
 * /api/guide/upload-url instead and it lands in a temp folder, so the whole
 * flow runs on a laptop. In production without it the flow runs as a demo:
 * the browser shows each file uploading but sends nothing, and the team's
 * email lists the file names with no links. A project whose host doesn't
 * resolve (deleted, or a typo in the settings) counts as none.
 */

export const BUCKET = "guide-uploads";
const LINK_TTL_S = 7 * 24 * 60 * 60;
const UPLOAD_ID = /^[0-9a-f]{32}$/;
const OBJECT_PATH = /^[0-9a-f]{32}\/[0-9a-f]{8}-[A-Za-z0-9._-]{1,100}$/;

export type StoredFile = { path: string; name: string; size: number };

const dev = () => process.env.NODE_ENV !== "production";

async function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  if (!(await hostResolves(url, "guide"))) return null;
  return { url, key };
}

export async function storageBackend(): Promise<"supabase" | "file" | "demo"> {
  if (await supabase()) return "supabase";
  return dev() ? "file" : "demo";
}

/* Same rule as the analytics store: only legacy JWT keys go in Authorization. */
const headers = (key: string, extra: Record<string, string> = {}) => ({
  apikey: key,
  ...(key.startsWith("eyJ") ? { authorization: `Bearer ${key}` } : {}),
  ...extra,
});

export const newUploadId = () => randomBytes(16).toString("hex");
export const isUploadId = (value: unknown): value is string =>
  typeof value === "string" && UPLOAD_ID.test(value);
export const isObjectPath = (value: unknown): value is string =>
  typeof value === "string" && OBJECT_PATH.test(value);

/** A safe, short object name that keeps the extension. */
function safeName(name: string) {
  const ext = name.match(/\.[A-Za-z0-9]{1,5}$/)?.[0] ?? "";
  const stem = name
    .slice(0, name.length - ext.length)
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+|-+$/g, "")
    .slice(0, 80);
  return `${stem || "file"}${ext.toLowerCase()}`;
}

/** Where a new file for this upload is stored. The random part keeps two
 * files of the same name apart. */
export const objectPath = (uploadId: string, name: string) =>
  `${uploadId}/${randomBytes(4).toString("hex")}-${safeName(name)}`;

/** The name a stored file is shown under: its object name without the prefix. */
const displayName = (objectName: string) => objectName.replace(/^[0-9a-f]{8}-/, "");

const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

/* ------------------------------------------------- the dev temp folder */

const devRoot = () => path.join(tmpdir(), "truhu-guide-uploads");
/** Signs dev upload links. A new key each time the server starts is fine. */
const devKey = randomBytes(32);
const devToken = (objectPath: string) =>
  createHmac("sha256", devKey).update(objectPath).digest("base64url");

export function devTokenValid(objectPath: string, token: string) {
  const expected = Buffer.from(devToken(objectPath));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function writeDevFile(objectPath: string, bytes: Uint8Array) {
  const file = path.join(devRoot(), ...objectPath.split("/"));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  console.info(`[guide] no Supabase; saved ${bytes.length} bytes to ${file}`);
}

/* ------------------------------------------------------------- calls */

/** Where the browser PUTs one file, with the headers it must send. */
export async function signUpload(objectPath: string, contentType: string, origin: string) {
  const db = await supabase();
  if (!db) {
    const url = new URL("/api/guide/upload-url", origin);
    url.searchParams.set("path", objectPath);
    url.searchParams.set("token", devToken(objectPath));
    return { url: url.toString(), headers: { "content-type": contentType } };
  }
  const res = await fetch(`${db.url}/storage/v1/object/upload/sign/${BUCKET}/${encodePath(objectPath)}`, {
    method: "POST",
    headers: headers(db.key, { "content-type": "application/json" }),
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    const hint = /bucket not found/i.test(text)
      ? ` (create the "${BUCKET}" bucket: run analytics dashboard/supabase/schema.sql)`
      : "";
    throw new Error(`guide upload sign failed: ${res.status}${hint} ${text.slice(0, 300)}`);
  }
  const { url } = (await res.json()) as { url: string };
  return { url: `${db.url}/storage/v1${url}`, headers: { "content-type": contentType } };
}

/** The files stored for one upload, oldest name first. */
export async function listUpload(uploadId: string): Promise<StoredFile[]> {
  const db = await supabase();
  if (!db) {
    const dir = path.join(devRoot(), uploadId);
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      return [];
    }
    const files = await Promise.all(
      names.sort().map(async (name) => ({
        path: `${uploadId}/${name}`,
        name: displayName(name),
        size: (await stat(path.join(dir, name))).size,
      })),
    );
    return files;
  }
  const res = await fetch(`${db.url}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: headers(db.key, { "content-type": "application/json" }),
    body: JSON.stringify({ prefix: uploadId, limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`guide list failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const rows = (await res.json()) as { name: string; id: string | null; metadata?: { size?: number } }[];
  // Folders come back with a null id.
  return rows
    .filter((row) => row.id)
    .map((row) => ({
      path: `${uploadId}/${row.name}`,
      name: displayName(row.name),
      size: row.metadata?.size ?? 0,
    }));
}

/** A link that downloads one file for seven days. */
export async function downloadLink(objectPath: string) {
  const db = await supabase();
  if (!db) return pathToFileURL(path.join(devRoot(), ...objectPath.split("/"))).href;
  const res = await fetch(`${db.url}/storage/v1/object/sign/${BUCKET}/${encodePath(objectPath)}`, {
    method: "POST",
    headers: headers(db.key, { "content-type": "application/json" }),
    body: JSON.stringify({ expiresIn: LINK_TTL_S }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`guide link failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${db.url}/storage/v1${signedURL}`;
}
