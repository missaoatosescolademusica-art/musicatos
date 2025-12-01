import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"
import { GET as IMPERSONATE } from "@/app/api/auth/impersonate/route"
import { GET as SESSIONS } from "@/app/api/auth/impersonate/sessions/route"
import { POST as REVOKE } from "@/app/api/auth/impersonate/revoke/route"
import { GET as ME } from "@/app/api/auth/me/route"

function reqWithRole(url: string, role: string, userId = "test-admin") {
  const token = generateJwt({ sub: userId, role })
  const headers = new Headers({ cookie: `auth=${token}` })
  return new NextRequest(new Request(url, { headers }))
}

describe("admin sessions management", () => {
  it("lists and revokes impersonation sessions, and revoked token fails", async () => {
    await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const admin = await prisma.user.upsert({ where: { id: "test-admin" }, update: {}, create: { id: "test-admin", name: "Admin", email: `admin_${Date.now()}@x.com`, passwordHash: "x", roleId: (await prisma.role.findUnique({ where: { name: "admin" } }))!.id } })
    const user = await prisma.user.create({ data: { name: "User", email: `u_${Date.now()}@x.com`, passwordHash: "x", roleId: (await prisma.role.findUnique({ where: { name: "user" } }))!.id } })
    const imp = await IMPERSONATE(reqWithRole(`http://localhost/api/auth/impersonate?userId=${user.id}`, "admin"))
    const { token } = await imp.json()
    const sess = await SESSIONS(reqWithRole("http://localhost/api/auth/impersonate/sessions", "admin"))
    expect(sess.status).toBe(200)
    const list = await sess.json()
    expect((list.sessions || []).length).toBeGreaterThan(0)
    const jti = String(list.sessions[0].jti)
    const rev = await REVOKE(new NextRequest(new Request("http://localhost/api/auth/impersonate/revoke", { method: "POST", headers: new Headers({ cookie: `auth=${generateJwt({ sub: admin.id, role: "admin" })}`, "content-type": "application/json" }), body: JSON.stringify({ jti }) })))
    expect(rev.status).toBe(200)
    const resBearer = await ME(new NextRequest(new Request("http://localhost/api/auth/me", { headers: new Headers({ Authorization: `Bearer ${token}` }) })))
    expect(resBearer.status).toBe(401)
  }, 15000)
})
