import { describe, it, expect } from "vitest"
import { POST, GET } from "@/app/api/user/avatar/route"
import { NextRequest } from "next/server"
import { generateJwt } from "@/lib/auth"
import { prisma } from "@/lib/db"

function authReq(url: string, options: any = {}) {
  const token = generateJwt({ sub: "test-user" })
  const headers = new Headers(options.headers || {})
  headers.set("cookie", `auth=${token}`)
  const req = new Request(url, { ...options, headers })
  return new NextRequest(req)
}

async function upload(type: string) {
  const fd = new FormData()
  const blob = new Blob([new Uint8Array([1,2,3,4])], { type })
  fd.append("file", new File([blob], `a.${type.split("/")[1]}`, { type }))
  return await POST(authReq("http://localhost/api/user/avatar", { method: "POST", body: fd }))
}

describe("avatar upload success", () => {
  it("prepare user", async () => {
    await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const role = await prisma.role.findUnique({ where: { name: "user" } })
    await prisma.user.upsert({ where: { id: "test-user" }, update: {}, create: { id: "test-user", name: "Tester", email: `tester_${Date.now()}@example.com`, passwordHash: "x", roleId: role!.id } })
  })
  it("uploads PNG and serves bytes", async () => {
    const res = await upload("image/png")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toMatch(/\/api\/user\/avatar\?user=/)
    const abs = new URL(json.url, "http://localhost").toString()
    const resGet = await GET(authReq(abs))
    expect(resGet.status).toBe(200)
  })
  it("uploads JPEG and serves bytes", async () => {
    const res = await upload("image/jpeg")
    expect(res.status).toBe(200)
    const json = await res.json()
    const abs = new URL(json.url, "http://localhost").toString()
    const resGet = await GET(authReq(abs))
    expect(resGet.status).toBe(200)
  })
  it("uploads WebP and serves bytes", async () => {
    const res = await upload("image/webp")
    expect(res.status).toBe(200)
    const json = await res.json()
    const abs = new URL(json.url, "http://localhost").toString()
    const resGet = await GET(authReq(abs))
    expect(resGet.status).toBe(200)
  })
})
