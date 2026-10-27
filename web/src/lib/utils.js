export const SCORE_LABELS = {
  required_skills: "Required skills",
  experience_level: "Experience level",
  domain_relevance: "Domain relevance",
  keywords: "Keywords",
};

export const wordCount = (text) => (text || "").trim().split(/\s+/).filter(Boolean).length;

/** Cheap stable hash, used to detect when inputs changed after an analysis. */
export function hashInputs(...parts) {
  const s = parts.join("\u0000");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h}`;
}

/** Warm, muted status palette. Returns a tone name used by Badge / ScoreRing. */
export function scoreTone(score) {
  if (score >= 75) return "sage";
  if (score >= 50) return "amber";
  return "clay";
}

export const TONE_HEX = { sage: "#44744f", amber: "#a87420", clay: "#a14a3d", gold: "#b98f55" };

export function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const PLACEHOLDER_RE = /(\[[^\]]*\])/g;

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
