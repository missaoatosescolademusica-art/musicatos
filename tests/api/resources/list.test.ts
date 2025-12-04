import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "@/app/api/resources/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function req(url: string, role?: string) {
  const headers = role ? new Headers({ cookie: `auth=${generateJwt({ sub: `res-${role}`, role })}` }) : undefined
  return new NextRequest(new Request(url, { headers }))
}

describe("resources list api", () => {
  it("requires admin/professor (403)", async () => {
    const r = await GET(req("http://localhost/api/resources"))
    expect(r.status).toBe(403)
  })

  it("returns list for admin", async () => {
    await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    await prisma.user.upsert({ where: { id: "res-admin" }, update: {}, create: { id: "res-admin", name: "Admin", email: `adm_${Date.now()}@x.com`, passwordHash: "x", roleId: (await prisma.role.findUnique({ where: { name: "admin" } }))!.id } })
    const r = await GET(req("http://localhost/api/resources?page=1&limit=5", "admin"))
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(Array.isArray(j.data)).toBe(true)
  })
})
