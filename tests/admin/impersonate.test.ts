import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { GET as USERS } from "@/app/api/users/route"
import { GET as IMPERSONATE } from "@/app/api/auth/impersonate/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function reqWithRole(url: string, role: string, userId = "test-admin") {
  const token = generateJwt({ sub: userId, role })
  const headers = new Headers({ cookie: `auth=${token}` })
  return new NextRequest(new Request(url, { headers }))
}

describe("admin users and impersonate", () => {
  it("lists users only for admin", async () => {
    await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const role = await prisma.role.findUnique({ where: { name: "admin" } })
    await prisma.user.upsert({ where: { id: "test-admin" }, update: {}, create: { id: "test-admin", name: "Admin", email: `admin_${Date.now()}@x.com`, passwordHash: "x", roleId: role!.id } })
    const resAdmin = await USERS(reqWithRole("http://localhost/api/users?page=1&limit=5", "admin"))
    expect(resAdmin.status).toBe(200)
    const resProf = await USERS(reqWithRole("http://localhost/api/users?page=1&limit=5", "professor", "test-prof"))
    expect(resProf.status).toBe(403)
  }, 15000)

  it("impersonate returns token for admin and forbids others", async () => {
    const user = await prisma.user.create({ data: { name: "User", email: `u_${Date.now()}@x.com`, passwordHash: "x", roleId: (await prisma.role.findUnique({ where: { name: "user" } }))!.id } })
    const ok = await IMPERSONATE(reqWithRole(`http://localhost/api/auth/impersonate?userId=${user.id}`, "admin"))
    expect(ok.status).toBe(200)
    const json = await ok.json()
    expect(String(json.token || "").length).toBeGreaterThan(10)
    const bad = await IMPERSONATE(reqWithRole(`http://localhost/api/auth/impersonate?userId=${user.id}`, "professor", "test-prof"))
    expect(bad.status).toBe(403)
  }, 15000)
})
