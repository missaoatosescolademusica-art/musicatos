import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"
import { GET as ME } from "@/app/api/auth/me/route"
import { POST as LOGOUT } from "@/app/api/auth/logout/route"

function reqWithBearer(url: string, userId: string, role: string) {
  const token = generateJwt({ sub: userId, role })
  const headers = new Headers({ Authorization: `Bearer ${token}`, origin: "http://localhost", host: "localhost" })
  return new NextRequest(new Request(url, { headers }))
}

function reqWithCookie(url: string, userId: string, role: string) {
  const token = generateJwt({ sub: userId, role })
  const headers = new Headers({ cookie: `auth=${token}`, origin: "http://localhost", host: "localhost" })
  return new NextRequest(new Request(url, { headers }))
}

describe("session isolation", () => {
  it("admin persists after professor logout (bearer cleared)", async () => {
    const roleAdmin = await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    const roleProf = await prisma.role.upsert({ where: { name: "professor" }, update: {}, create: { name: "professor" } })
    const admin = await prisma.user.create({ data: { name: "Admin", email: `adm_${Date.now()}@x.com`, passwordHash: "x", roleId: roleAdmin.id } })
    const prof = await prisma.user.create({ data: { name: "Professor", email: `prof_${Date.now()}@x.com`, passwordHash: "x", roleId: roleProf.id } })

    const resAdmin = await ME(reqWithCookie("http://localhost/api/auth/me", admin.id, "admin"))
    expect(resAdmin.status).toBe(200)

    const resProf = await ME(reqWithBearer("http://localhost/api/auth/me", prof.id, "professor"))
    expect(resProf.status).toBe(200)

    // simulate professor logout by using expired bearer
    const expiredBearer = new NextRequest(new Request("http://localhost/api/auth/me", { headers: new Headers({ Authorization: `Bearer ${generateJwt({ sub: prof.id, role: "professor" }, -1)}` }) }))
    const resExpired = await ME(expiredBearer)
    expect(resExpired.status).toBe(401)

    // admin remains active
    const resAdmin2 = await ME(reqWithCookie("http://localhost/api/auth/me", admin.id, "admin"))
    expect(resAdmin2.status).toBe(200)
  }, 15000)

  it("logout origin validation", async () => {
    const admin = await prisma.user.create({ data: { name: "Admin2", email: `adm2_${Date.now()}@x.com`, passwordHash: "x", roleId: (await prisma.role.findUnique({ where: { name: "admin" } }))!.id } })
    const reqBad = new NextRequest(new Request("http://localhost/api/auth/logout", { method: "POST", headers: new Headers({ cookie: `auth=${generateJwt({ sub: admin.id, role: "admin" })}`, origin: "http://evil.com", host: "localhost" }) }))
    const bad = await LOGOUT(reqBad)
    expect(bad.status).toBe(403)
    const reqOk = new NextRequest(new Request("http://localhost/api/auth/logout", { method: "POST", headers: new Headers({ cookie: `auth=${generateJwt({ sub: admin.id, role: "admin" })}`, origin: "http://localhost", host: "localhost" }) }))
    const ok = await LOGOUT(reqOk)
    expect(ok.status).toBe(200)
  }, 15000)
})
