import { describe, it, expect } from "vitest"
import { GET, POST } from "@/app/api/attendance/route"
import { NextRequest } from "next/server"

function makeReq(url: string, options: any = {}) {
  const req = new Request(url, options)
  return new NextRequest(req)
}

describe("attendance api", () => {
  it("GET should return 401 without auth", async () => {
    const res = await GET(makeReq("http://localhost/api/attendance"))
    expect(res.status).toBe(401)
  })

  it("POST should return 401 without auth", async () => {
    const res = await POST(makeReq("http://localhost/api/attendance", { method: "POST", body: JSON.stringify({}) }))
    expect(res.status).toBe(401)
  })
})
