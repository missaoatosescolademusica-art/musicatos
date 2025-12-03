import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { GET as ME } from "@/app/api/auth/me/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function reqWithBearer(url: string, userId: string, role: string) {
  const token = generateJwt({ sub: userId, role })
  const headers = new Headers({ Authorization: `Bearer ${token}` })
  return new NextRequest(new Request(url, { headers }))
}

function reqWithCookie(url: string, userId: string, role: string) {
  const token = generateJwt({ sub: userId, role })
  const headers = new Headers({ cookie: `auth=${token}` })
  return new NextRequest(new Request(url, { headers }))
}

describe("auto-login me endpoint", () => {
  it("returns user from bearer token even if admin cookie exists", async () => {
    const roleAdmin = await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    const roleProf = await prisma.role.upsert({ where: { name: "professor" }, update: {}, create: { name: "professor" } })
    const admin = await prisma.user.upsert({ where: { id: "auto-admin" }, update: {}, create: { id: "auto-admin", name: "Admin", email: `adm_${Date.now()}@x.com`, passwordHash: "x", roleId: roleAdmin.id } })
    const prof = await prisma.user.create({ data: { name: "Professor", email: `prof_${Date.now()}@x.com`, passwordHash: "x", roleId: roleProf.id } })

    const bearerReq = reqWithBearer("http://localhost/api/auth/me", prof.id, "professor")
    const resBearer = await ME(bearerReq)
    expect(resBearer.status).toBe(200)
    const jsonBearer = await resBearer.json()
    expect(jsonBearer.id).toBe(prof.id)
    expect(jsonBearer.role).toBe("professor")

    const cookieReq = reqWithCookie("http://localhost/api/auth/me", admin.id, "admin")
    const resCookie = await ME(cookieReq)
    expect(resCookie.status).toBe(200)
    const jsonCookie = await resCookie.json()
    expect(jsonCookie.id).toBe(admin.id)
    expect(jsonCookie.role).toBe("admin")
  }, 15000)
})
