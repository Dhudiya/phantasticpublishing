/**
 * Security utilities for validating and sanitizing untrusted data.
 */

const SAFE_URL_PROTOCOLS = ["http:", "https:"];

/**
 * Returns a safe URL string suitable for use in `href` attributes.
 * Only `http:` and `https:` protocols are allowed. Relative paths
 * (starting with `/`) are passed through. Everything else (including
 * `javascript:`, `data:`, `vbscript:`, etc.) returns `undefined`.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (SAFE_URL_PROTOCOLS.includes(parsed.protocol)) return trimmed;
  } catch {
    // Not a valid absolute URL — reject
  }
  return undefined;
}

/**
 * Returns a safe URL for `src` attributes on `<img>` / `<source>`.
 * Allows `http:`, `https:`, and `data:image/` (for inline images only).
 */
export function safeSrc(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (SAFE_URL_PROTOCOLS.includes(parsed.protocol)) return trimmed;
    if (parsed.protocol === "data:" && parsed.pathname.startsWith("image/")) {
      return trimmed;
    }
  } catch {
    // fall through
  }
  return undefined;
}

/** Allowed file extensions for media uploads. */
export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg",
] as const;

/** Allowed MIME types for media uploads. */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "image/avif", "image/svg+xml",
] as const;

/** Maximum upload size: 10 MB. */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/**
 * Validates a file before upload. Returns an error string if invalid,
 * or null if the file passes all checks.
 */
export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE) {
    return `File is too large. Maximum size is ${MAX_UPLOAD_SIZE / 1024 / 1024} MB.`;
  }
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
    return "File type is not allowed. Only images are accepted.";
  }
  if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "File type is not allowed. Only images are accepted.";
  }
  return null;
}

/**
 * Sanitizes a filename to prevent path traversal — strips directory
 * separators and restricts to alphanumeric, dash, underscore, dot.
 */
export function sanitizeFilename(name: string): string {
  const base = name.split("/").pop()?.split("\\").pop() ?? name;
  return base.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 100) || "file";
}

/**
 * Basic email format validation.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/**
 * Truncates a string to a max length, preventing overflow attacks.
 */
export function clampLength(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}
