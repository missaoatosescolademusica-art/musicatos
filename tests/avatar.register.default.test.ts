import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { POST as REGISTER } from "@/app/api/auth/register/route"
import { GET as ME } from "@/app/api/auth/me/route"
import { POST as AVATAR_POST } from "@/app/api/user/avatar/route"
import { generateJwt } from "@/lib/auth"

function reqWithCsrf(url: string, body: any, headers: Record<string, string> = {}) {
  const csrf = "test-csrf-token"
  const h = new Headers({
    "content-type": "application/json",
    "x-csrf-token": csrf,
    origin: "http://localhost",
    host: "localhost",
    ...headers,
  })
  h.set("cookie", `csrfToken=${csrf}`)
  const req = new Request(url, { method: "POST", body: JSON.stringify(body), headers: h })
  return new NextRequest(req)
}

function reqWithAuth(url: string, userId: string, role: string) {
  const token = generateJwt({ sub: userId, role })
  const h = new Headers({ host: "localhost", cookie: `auth=${token}` })
  const req = new Request(url, { headers: h })
  return new NextRequest(req)
}

async function ensureRole(name: string) {
  await prisma.role.upsert({ where: { name }, update: {}, create: { name } })
}

describe("avatar default on register", () => {
  it("new professor gets default avatar (none from server)", async () => {
    await ensureRole("professor")
    const email = `prof_${Date.now()}@example.com`
    const res = await REGISTER(reqWithCsrf("http://localhost/api/auth/register", {
      name: "Prof",
      email,
      password: "Aa1!aaaa",
      confirmPassword: "Aa1!aaaa",
      role: "professor",
    }))
    expect(res.status).toBe(302)
    const u = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    expect(u).toBeTruthy()
    const meRes = await ME(reqWithAuth("http://localhost/api/auth/me", u!.id, u!.role.name))
    expect(meRes.status).toBe(200)
    const json = await meRes.json()
    expect(json.avatarUrl).toBeUndefined()
  }, 15000)

  it("admin avatar is not replicated to newly registered professor", async () => {
    await ensureRole("admin"); await ensureRole("user"); await ensureRole("professor")
    const admin = await prisma.user.upsert({
      where: { id: "admin-avatar" },
      update: {},
      create: { id: "admin-avatar", name: "Admin", email: `adm_${Date.now()}@example.com`, passwordHash: "x", roleId: (await prisma.role.findUnique({ where: { name: "admin" } }))!.id }
    })
    const fd = new FormData()
    const blob = new Blob([new Uint8Array([1,2,3,4])], { type: "image/png" })
    fd.append("file", new File([blob], "a.png", { type: "image/png" }))
    const avReq = new NextRequest(new Request("http://localhost/api/user/avatar", { method: "POST", body: fd, headers: new Headers({ cookie: `auth=${generateJwt({ sub: admin.id, role: "admin" })}` }) }))
    const avRes = await AVATAR_POST(avReq)
    expect(avRes.status).toBe(200)

    const email = `prof2_${Date.now()}@example.com`
    const regRes = await REGISTER(reqWithCsrf("http://localhost/api/auth/register", {
      name: "Prof2",
      email,
      password: "Aa1!aaaa",
      confirmPassword: "Aa1!aaaa",
      role: "professor",
    }))
    expect(regRes.status).toBe(302)
    const u = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    const meRes = await ME(reqWithAuth("http://localhost/api/auth/me", u!.id, u!.role.name))
    const json = await meRes.json()
    expect(json.avatarUrl).toBeUndefined()
  }, 20000)

  it("register multiple users concurrently keeps default avatars", async () => {
    await ensureRole("user"); await ensureRole("professor")
    const emails = [
      `multi_${Date.now()}_1@example.com`,
      `multi_${Date.now()}_2@example.com`,
    ]
    const regs = await Promise.all(emails.map((email) => REGISTER(reqWithCsrf("http://localhost/api/auth/register", {
      name: email.split("@")[0],
      email,
      password: "Aa1!aaaa",
      confirmPassword: "Aa1!aaaa",
      role: "user",
    }))))
    for (const r of regs) expect(r.status).toBe(302)
    const users = await Promise.all(emails.map((email) => prisma.user.findUnique({ where: { email }, include: { role: true } })))
    for (const u of users) {
      const meRes = await ME(reqWithAuth("http://localhost/api/auth/me", u!.id, u!.role.name))
      const json = await meRes.json()
      expect(json.avatarUrl).toBeUndefined()
    }
  }, 20000)
})
