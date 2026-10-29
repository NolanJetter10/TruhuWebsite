import { after } from "next/server";
import { clientIp, json, rateLimited, sameOrigin } from "@/lib/ensemble";
import { MAX_FILES } from "@/lib/guide/files";
import { sendGuideEmails } from "@/lib/guide/email";
import { isUploadId, listUpload, storageBackend, type StoredFile } from "@/lib/guide/storage";

/**
 * Finishes a guide request: the visitor's email for files already uploaded
 * (see ./upload-url). This checks the files are really there, answers, and
 * then emails the team their links and the visitor a confirmation. In the
 * storage-less demo nothing was uploaded, so it takes the browser's list of
 * file names instead.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** In the storage-less demo, the files the browser says it chose. */
function demoFiles(value: unknown): StoredFile[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_FILES).flatMap((file) => {
    const { name, size } = (file ?? {}) as { name?: unknown; size?: unknown };
    const clean = text(name, 200);
    return clean ? [{ path: "", name: clean, size: typeof size === "number" ? size : 0 }] : [];
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  // Honeypot: a field no person sees. Answer as if it worked.
  if (text(body.website, 200)) return json({ ok: true });

  const email = text(body.email, 200).toLowerCase();
  if (!EMAIL.test(email)) {
    return json({ error: "Enter a valid work email.", code: "email" }, 422);
  }
  if (!isUploadId(body.uploadId)) return json({ error: "Bad request." }, 400);
  const uploadId = body.uploadId;

  if (
    // Wide per address, since an office shares one; tight per email.
    rateLimited(`guide:${clientIp(request)}`, 30, 10 * 60_000) ||
    rateLimited(`guide:${email}`, 6, 10 * 60_000)
  ) {
    return json({ error: "That's a lot of requests in a few minutes. Try again shortly.", code: "rate" }, 429);
  }
  let files: StoredFile[];
  try {
    files =
      (await storageBackend()) === "demo"
        ? demoFiles(body.files) // Nothing was stored; the browser says what it "sent".
        : (await listUpload(uploadId)).slice(0, MAX_FILES);
  } catch (error) {
    console.error("[guide] listing the upload failed", error);
    return json({ error: "That didn't go through. Try again in a moment.", code: "unavailable" }, 502);
  }
  if (!files.length) {
    return json({ error: "Add at least one file first.", code: "no_files" }, 422);
  }

  const context = (body.context ?? {}) as Record<string, unknown>;
  after(() =>
    sendGuideEmails({
      uploadId,
      email,
      files,
      source: text(context.source, 120) || undefined,
      campaign: text(context.campaign, 160) || undefined,
    }),
  );
  return json({ ok: true, files: files.length });
}
