export type CookieConsent = {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  accepted: boolean
  declined: boolean
  timestamp: number
}

const CONSENT_KEY = "cookieConsent"
const LAST_SHOWN_KEY = "cookieConsentLastShown"

export function readConsent(): CookieConsent | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(CONSENT_KEY) : null
    if (!raw) return null
    const obj = JSON.parse(raw)
    return obj && typeof obj === "object" ? (obj as CookieConsent) : null
  } catch {
    return null
  }
}

export function writeConsent(c: CookieConsent) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(CONSENT_KEY, JSON.stringify(c))
  } catch {}
}

export function markShown(ts: number = Date.now()) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(LAST_SHOWN_KEY, String(ts))
  } catch {}
}

export function readLastShown(): number {
  try {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(LAST_SHOWN_KEY) : null
    return v ? Number(v) : 0
  } catch {
    return 0
  }
}

export function shouldShowConsent(periodMs: number = 7 * 24 * 60 * 60 * 1000): boolean {
  const c = readConsent()
  if (c && (c.accepted || c.declined)) return false
  const last = readLastShown()
  return !last || Date.now() - last >= periodMs
}

export function validateConsentForm(data: { analytics: boolean; marketing: boolean }) {
  return {
    valid: typeof data.analytics === "boolean" && typeof data.marketing === "boolean",
    message: ![typeof data.analytics === "boolean", typeof data.marketing === "boolean"].every(Boolean)
      ? "Dados inválidos"
      : "",
  }
}

export async function postConsent(data: CookieConsent) {
  try {
    const res = await fetch("/api/privacy/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch {
    return false
  }
}

