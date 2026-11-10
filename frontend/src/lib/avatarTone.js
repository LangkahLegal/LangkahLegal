export const AVATAR_TONES = ["primary", "secondary", "info", "sage", "accent"];

export const AVATAR_TONE_CLASSES = {
  primary: "bg-primary-soft text-primary-text",
  secondary: "bg-secondary-soft text-secondary-text",
  info: "bg-info-soft text-info-text",
  sage: "bg-sage-soft text-sage-text",
  accent: "bg-accent-tint text-accent-text",
};

/**
 * Menghasilkan tone deterministik dari nama pengguna agar warna fallback selalu konsisten.
 */
export function getAvatarTone(name = "User") {
  const normalized = String(name || "User")
    .trim()
    .toLowerCase();

  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const index = (hash >>> 0) % AVATAR_TONES.length;
  return AVATAR_TONES[index];
}

export function getAvatarToneClasses(name = "User") {
  const tone = getAvatarTone(name);
  return AVATAR_TONE_CLASSES[tone] || AVATAR_TONE_CLASSES.primary;
}

export function getInitials(name = "User", fallback = "U") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getSafeAvatarUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

