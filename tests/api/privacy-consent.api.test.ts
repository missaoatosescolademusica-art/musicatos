import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/privacy/consent/route"

function req(url: string, body: any, origin = "http://localhost") {
  const h = new Headers({ "content-type": "application/json", origin, host: "localhost" })
  return new NextRequest(new Request(url, { method: "POST", headers: h, body: JSON.stringify(body) }))
}

describe("privacy consent api", () => {
  it("accepts valid body and origin", async () => {
    const r = await POST(req("http://localhost/api/privacy/consent", { analytics: true, marketing: false, accepted: true, declined: false, timestamp: Date.now() }))
    expect(r.status).toBe(200)
  })

  it("rejects invalid origin", async () => {
    const r = await POST(req("http://localhost/api/privacy/consent", { analytics: false, marketing: false, accepted: false, declined: true }, "http://evil.com"))
    expect(r.status).toBe(400)
  })

  it("rejects invalid body", async () => {
  
    const r = await POST(req("http://localhost/api/privacy/consent", { analytics: "yes", marketing: false, accepted: true, declined: false }))
    expect(r.status).toBe(400)
  })
})
