import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { POST as REQUEST } from "@/app/api/auth/password/email/request/route"
import { GET as VALIDATE } from "@/app/api/auth/password/email/validate/route"
import { POST as RESET } from "@/app/api/auth/password/email/reset/route"
import { comparePassword } from "@/lib/auth"

function post(url: string, body: any) {
  const h = new Headers({ "content-type": "application/json", "x-csrf-token": "t", origin: "http://localhost", host: "localhost" })
  h.set("cookie", "csrfToken=t")
  return new NextRequest(new Request(url, { method: "POST", headers: h, body: JSON.stringify(body) }))
}

function get(url: string) {
  const h = new Headers({ origin: "http://localhost", host: "localhost" })
  return new NextRequest(new Request(url, { method: "GET", headers: h }))
}

describe("password reset via email", () => {
  it("requests, validates and resets password", async () => {
    const role = await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const email = `u_${Date.now()}@x.com`
    const user = await prisma.user.create({ data: { name: "U", email, passwordHash: "x", roleId: role.id } })

    const r1 = await REQUEST(post("http://localhost/api/auth/password/email/request", { email, locale: "pt" }))
    expect(r1.status).toBe(200)

    const rec = await prisma.passwordReset.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
    expect(rec?.token).toBeTruthy()

    const v1 = await VALIDATE(get(`http://localhost/api/auth/password/email/validate?token=${rec!.token}`))
    expect(v1.status).toBe(200)
    const vj = await v1.json()
    expect(vj.valid).toBe(true)

    const newPassword = "Aa1!aaaa"
    const rs = await RESET(post("http://localhost/api/auth/password/email/reset", { token: rec!.token, password: newPassword, confirm: newPassword }))
    expect(rs.status).toBe(200)

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    const ok = await comparePassword(newPassword, updated!.passwordHash)
    expect(ok).toBe(true)
  }, 20000)

  it("blocks reset when token is expired and reports accurately", async () => {
    const role = await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const email = `u_${Date.now()}@x.com`
    const user = await prisma.user.create({ data: { name: "U", email, passwordHash: "x", roleId: role.id } })

    const r1 = await REQUEST(post("http://localhost/api/auth/password/email/request", { email, locale: "pt" }))
    expect(r1.status).toBe(200)

    const rec = await prisma.passwordReset.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
    expect(rec?.token).toBeTruthy()

    await prisma.passwordReset.update({ where: { id: rec!.id }, data: { expiresAt: new Date(Date.now() - 1000) } })

    const v1 = await VALIDATE(get(`http://localhost/api/auth/password/email/validate?token=${rec!.token}`))
    const vj = await v1.json()
    expect(v1.status).toBe(200)
    expect(vj.valid).toBe(false)
    expect(vj.reason).toBe("expired")

    const newPassword = "Aa1!aaaa"
    const rs = await RESET(post("http://localhost/api/auth/password/email/reset", { token: rec!.token, password: newPassword, confirm: newPassword }))
    expect(rs.status).toBe(410)
  }, 20000)
})
