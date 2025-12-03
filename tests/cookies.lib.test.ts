import { describe, it, expect, beforeEach } from "vitest"
import { validateConsentForm, shouldShowConsent, markShown, writeConsent, readConsent } from "@/lib/cookies"

function createLocalStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v) },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
  }
}

describe("cookies lib", () => {
  beforeEach(() => {
    // @ts-expect-error
    global.window = { localStorage: createLocalStorage() }
  })

  it("validates consent form booleans", () => {
    expect(validateConsentForm({ analytics: true, marketing: false }).valid).toBe(true)
    // @ts-expect-error
    expect(validateConsentForm({ analytics: "yes", marketing: false }).valid).toBe(false)
  })

  it("should show when never shown and no consent", () => {
    expect(shouldShowConsent(1000)).toBe(true)
  })

  it("should not show within period after shown", () => {
    markShown(Date.now())
    expect(shouldShowConsent(60 * 60 * 1000)).toBe(false)
  })

  it("should not show after accepted", () => {
    writeConsent({ necessary: true, analytics: true, marketing: false, accepted: true, declined: false, timestamp: Date.now() })
    expect(readConsent()!.accepted).toBe(true)
    expect(shouldShowConsent(1000)).toBe(false)
  })
})

