/**
 * What the guide upload on /BryanKleppe accepts, shared by the browser (to
 * refuse a file before it's sent) and the server (to refuse it anyway). The
 * Supabase bucket enforces the same types and size on the bytes themselves;
 * see `analytics dashboard/supabase/schema.sql`.
 */

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES = 10;

/** Extension → the type the file is stored as. The extension decides it,
 * since browsers often send no type at all for Word and PowerPoint files. */
export const GUIDE_FILE_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

/** For the file picker's `accept`. */
export const GUIDE_ACCEPT = Object.keys(GUIDE_FILE_TYPES).join(",");

export function guideFileType(name: string) {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  return Object.hasOwn(GUIDE_FILE_TYPES, ext) ? GUIDE_FILE_TYPES[ext] : null;
}

/** Why a file can't be sent, or null if it can. */
export function guideFileProblem(name: string, size: number): "type" | "size" | null {
  if (!guideFileType(name)) return "type";
  if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_BYTES) return "size";
  return null;
}
