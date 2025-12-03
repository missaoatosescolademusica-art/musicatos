import { describe, it, expect } from "vitest"
import { POST, GET } from "@/app/api/user/avatar/route"
import { NextRequest } from "next/server"
import { generateJwt } from "@/lib/auth"

function makeReq(url: string, options: any = {}) {
  const req = new Request(url, options)
  return new NextRequest(req)
}

function makeAuthCookie(sub: string = "test-user") {
  const token = generateJwt({ sub })
  return `auth=${token}`
}

describe("avatar api", () => {
  it("POST should return 401 without auth", async () => {
    const fd = new FormData()
    fd.append("file", new File([new Blob(["x"], { type: "image/png" })], "a.png", { type: "image/png" }))
    const res = await POST(makeReq("http://localhost/api/user/avatar", { method: "POST", body: fd }))
    expect(res.status).toBe(401)
  })

  it("POST should reject invalid type", async () => {
    const fd = new FormData()
    fd.append("file", new File([new Blob(["x"], { type: "text/plain" })], "a.txt", { type: "text/plain" }))
    const req = makeReq("http://localhost/api/user/avatar", { method: "POST", body: fd, headers: { Cookie: makeAuthCookie() } })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("POST should reject oversize file", async () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 1)
    const fd = new FormData()
    fd.append("file", new File([new Blob([big], { type: "image/png" })], "big.png", { type: "image/png" }))
    const req = makeReq("http://localhost/api/user/avatar", { method: "POST", body: fd, headers: { Cookie: makeAuthCookie() } })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("GET should return 401 without auth or user param", async () => {
    const res = await GET(makeReq("http://localhost/api/user/avatar"))
    expect(res.status).toBe(401)
  })
})
