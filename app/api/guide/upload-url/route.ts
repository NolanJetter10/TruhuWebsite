import { clientIp, json, rateLimited, sameOrigin } from "@/lib/ensemble";
import { MAX_FILE_BYTES, MAX_FILES, guideFileProblem, guideFileType } from "@/lib/guide/files";
import {
  devTokenValid,
  isObjectPath,
  isUploadId,
  newUploadId,
  objectPath,
  signUpload,
  storageBackend,
  writeDevFile,
} from "@/lib/guide/storage";

/**
 * Hands the guide upload a signed link per file, so each one goes from the
 * browser straight to storage. A visitor's first batch gets a new upload id;
 * later batches send it back to add to the same guide. The file's type and
 * size are checked here, and the bucket checks them again on the bytes.
 */

/** Files signed per upload id, so one guide stays at MAX_FILES. Per
 * instance, like the rate limits: a ceiling, not an exact count. */
const issued = new Map<string, number>();

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const backend = await storageBackend();
  if (rateLimited(`guide-sign:${clientIp(request)}`, 30, 10 * 60_000)) {
    return json({ error: "Too many uploads. Wait a moment and try again.", code: "rate" }, 429);
  }

  let body: { uploadId?: unknown; files?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length || files.length > MAX_FILES) {
    return json({ error: `Send 1 to ${MAX_FILES} files.`, code: "count" }, 400);
  }
  const wanted = files.map((file) => {
    const { name, size } = (file ?? {}) as { name?: unknown; size?: unknown };
    const safe = typeof name === "string" ? name.slice(0, 200) : "";
    const bytes = typeof size === "number" ? size : NaN;
    return { name: safe, size: bytes, problem: safe ? guideFileProblem(safe, bytes) : "type" };
  });
  const refused = wanted.find((file) => file.problem);
  if (refused) {
    return json(
      {
        error:
          refused.problem === "size"
            ? `Each file can be up to ${MAX_FILE_BYTES / 1024 / 1024} MB.`
            : "Send PDF, Word, PowerPoint, PNG or JPG files.",
        code: refused.problem,
        name: refused.name,
      },
      422,
    );
  }

  const uploadId = isUploadId(body.uploadId) ? body.uploadId : newUploadId();
  const count = (issued.get(uploadId) ?? 0) + wanted.length;
  if (count > MAX_FILES) {
    return json({ error: `Up to ${MAX_FILES} files per guide.`, code: "count" }, 422);
  }
  issued.set(uploadId, count);
  if (issued.size > 5_000) issued.clear();

  // No storage in production: a demo. The browser shows each file uploading
  // but has nowhere to send it (`url: null`).
  if (backend === "demo") {
    return json({
      uploadId,
      files: wanted.map((file) => ({ name: file.name, path: "", url: null, headers: {} })),
    });
  }

  const origin = new URL(request.url).origin;
  try {
    const signed = await Promise.all(
      wanted.map(async (file) => {
        const path = objectPath(uploadId, file.name);
        const type = guideFileType(file.name)!;
        return { name: file.name, path, ...(await signUpload(path, type, origin)) };
      }),
    );
    return json({ uploadId, files: signed });
  } catch (error) {
    console.error("[guide] signing uploads failed", error);
    issued.set(uploadId, count - wanted.length);
    return json({ error: "Uploads aren't working right now.", code: "unavailable" }, 502);
  }
}

/** Development only, without Supabase: the browser's PUT lands here. */
export async function PUT(request: Request) {
  if ((await storageBackend()) !== "file") return json({ error: "Not found." }, 404);
  const params = new URL(request.url).searchParams;
  const path = params.get("path");
  const token = params.get("token") ?? "";
  if (!isObjectPath(path) || !devTokenValid(path, token)) {
    return json({ error: "Bad upload link." }, 403);
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) return json({ error: "Too large." }, 413);
  await writeDevFile(path, bytes);
  return new Response(null, { status: 200 });
}
