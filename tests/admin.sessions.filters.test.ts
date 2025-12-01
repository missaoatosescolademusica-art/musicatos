import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"
import { GET as IMPERSONATE } from "@/app/api/auth/impersonate/route"
import { GET as SESSIONS } from "@/app/api/auth/impersonate/sessions/route"
import { POST as REVOKE_ALL } from "@/app/api/auth/impersonate/revoke-all/route"

function reqAdmin(url: string, id = "adm-x") {
  const token = generateJwt({ sub: id, role: "admin" })
  const headers = new Headers({ cookie: `auth=${token}` })
  return new NextRequest(new Request(url, { headers }))
}

describe("sessions filters and revoke-all", () => {
  it("filters by adminId and userId, revokes matching", async () => {
    const roleAdmin = await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    const roleUser = await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const adminA = await prisma.user.create({ data: { name: "AdminA", email: `adma_${Date.now()}@x.com`, passwordHash: "x", roleId: roleAdmin.id } })
    const adminB = await prisma.user.create({ data: { name: "AdminB", email: `admb_${Date.now()}@x.com`, passwordHash: "x", roleId: roleAdmin.id } })
    const user1 = await prisma.user.create({ data: { name: "User1", email: `u1_${Date.now()}@x.com`, passwordHash: "x", roleId: roleUser.id } })
    const user2 = await prisma.user.create({ data: { name: "User2", email: `u2_${Date.now()}@x.com`, passwordHash: "x", roleId: roleUser.id } })

    await IMPERSONATE(reqAdmin(`http://localhost/api/auth/impersonate?userId=${user1.id}`, adminA.id))
    await IMPERSONATE(reqAdmin(`http://localhost/api/auth/impersonate?userId=${user2.id}`, adminA.id))
    await IMPERSONATE(reqAdmin(`http://localhost/api/auth/impersonate?userId=${user1.id}`, adminB.id))

    const listAdminA = await SESSIONS(reqAdmin(`http://localhost/api/auth/impersonate/sessions?adminId=${adminA.id}`))
    const jsonAdminA = await listAdminA.json()
    expect((jsonAdminA.sessions || []).length).toBeGreaterThanOrEqual(2)

    const listUser1 = await SESSIONS(reqAdmin(`http://localhost/api/auth/impersonate/sessions?userId=${user1.id}`))
    const jsonUser1 = await listUser1.json()
    expect((jsonUser1.sessions || []).length).toBeGreaterThanOrEqual(2)

    const revokeRes = await REVOKE_ALL(reqAdmin("http://localhost/api/auth/impersonate/revoke-all", adminA.id))
    expect(revokeRes.status).toBe(200)
  }, 15000)
})
