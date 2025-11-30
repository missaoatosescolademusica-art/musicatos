import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/user/status/route"
import { NextRequest } from "next/server"

function makeReq(url: string) {
  return new NextRequest(new Request(url))
}

describe("user status api", () => {
  it("returns empty list when no ids provided", async () => {
    const res = await GET(makeReq("http://localhost/api/user/status"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.statuses)).toBe(true)
    expect(json.statuses.length).toBe(0)
  })

  it("returns statuses for multiple ids", async () => {
    const res = await GET(makeReq("http://localhost/api/user/status?ids=a,b,c"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.statuses.length).toBe(3)
    const valid = ["online", "away", "offline"]
    for (const s of json.statuses) expect(valid.includes(s.status)).toBe(true)
  })
})
