// Shared rules for video testimonial uploads (used by the admin page and API routes).

export const VIDEO_TESTIMONIAL_KEY_PREFIX = "video-testimonials/"

export const VIDEO_TESTIMONIAL_MAX_BYTES = 500 * 1024 * 1024 // 500MB

export const VIDEO_TESTIMONIAL_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
}

export const isAllowedVideoType = (contentType: unknown): contentType is string =>
  typeof contentType === "string" && contentType in VIDEO_TESTIMONIAL_TYPES

export const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Trims a text field; returns null for empty values and caps the length. */
export const cleanText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, maxLength)
  return trimmed || null
}
