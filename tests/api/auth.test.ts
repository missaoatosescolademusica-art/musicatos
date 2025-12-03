import { describe, it, expect } from "vitest"
import { validateEmail, validatePasswordComplexity, sanitizeName, hashPassword, comparePassword, generateJwt } from "@/lib/auth"

describe("auth utils", () => {
  it("validates email", () => {
    expect(validateEmail("a@b.com")).toBe(true)
    expect(validateEmail("invalid")).toBe(false)
  })
  it("validates password complexity", () => {
    expect(validatePasswordComplexity("Aa1!aaaa")).toBe(true)
    expect(validatePasswordComplexity("short")).toBe(false)
  })
  it("sanitizes name", () => {
    expect(sanitizeName("<script>x</script>Nome")).toBe("scriptxscriptNome")
  })
  it("hash and compare password", async () => {
    const hash = await hashPassword("Aa1!aaaa")
    const ok = await comparePassword("Aa1!aaaa", hash)
    expect(ok).toBe(true)
  })
  it("generates jwt with exp", () => {
    const token = generateJwt({ sub: "user" })
    expect(typeof token).toBe("string")
  })
})
