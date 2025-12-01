import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/auth/register/route"
import { prisma } from "@/lib/db"

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

describe("register roles", () => {
  it("persists role professor when requested", async () => {
    await prisma.role.upsert({ where: { name: "professor" }, update: {}, create: { name: "professor" } })
    const email = `prof_${Date.now()}@example.com`
    const res = await POST(reqWithCsrf("http://localhost/api/auth/register", {
      name: "Prof Test",
      email,
      password: "Aa1!aaaa",
      confirmPassword: "Aa1!aaaa",
      role: "professor",
    }))
    expect(res.status).toBe(302)
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    expect(user?.role.name).toBe("professor")
  }, 15000)

  it("falls back to user for admin without invite", async () => {
    await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const email = `admin_no_${Date.now()}@example.com`
    const res = await POST(reqWithCsrf("http://localhost/api/auth/register", {
      name: "Admin No Invite",
      email,
      password: "Aa1!aaaa",
      confirmPassword: "Aa1!aaaa",
      role: "admin",
    }))
    expect(res.status).toBe(302)
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    expect(user?.role.name).toBe("user")
  }, 15000)

  it("assigns admin when invite header matches secret", async () => {
    process.env.ADMIN_INVITE_SECRET = "inv-secret"
    const email = `admin_yes_${Date.now()}@example.com`
    const res = await POST(reqWithCsrf("http://localhost/api/auth/register", {
      name: "Admin With Invite",
      email,
      password: "Aa1!aaaa",
      confirmPassword: "Aa1!aaaa",
      role: "admin",
    }, { "x-admin-invite": "inv-secret" }))
    expect(res.status).toBe(302)
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    expect(user?.role.name).toBe("admin")
  }, 15000)
})
