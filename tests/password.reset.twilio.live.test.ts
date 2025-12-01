import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { POST as REQUEST } from "@/app/api/auth/password/request/route"
import { POST as VERIFY } from "@/app/api/auth/password/verify/route"
import { POST as RESET } from "@/app/api/auth/password/reset/route"
import { comparePassword } from "@/lib/auth"

function req(url: string, body: any) {
  const h = new Headers({ "content-type": "application/json", "x-csrf-token": "t", origin: "http://localhost", host: "localhost" })
  h.set("cookie", "csrfToken=t")
  return new NextRequest(new Request(url, { method: "POST", headers: h, body: JSON.stringify(body) }))
}

describe("password reset via real twilio", () => {
  it("requests, verifies and resets password (live)", async () => {
    const to = process.env.TWILIO_TEST_TO_NUMBER || ""
    const sid = process.env.TWILIO_ACCOUNT_SID || ""
    const token = process.env.TWILIO_AUTH_TOKEN || ""
    const from = process.env.TWILIO_FROM_NUMBER || ""
    expect(!!to && !!sid && !!token && !!from).toBe(true)

    const role = await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const user = await prisma.user.create({ data: { name: "Twilio Live", email: `tw_${Date.now()}@x.com`, phone: to, passwordHash: "x", roleId: role.id } })

    const r1 = await REQUEST(req("http://localhost/api/auth/password/request", { emailOrPhone: to, locale: "pt" }))
    expect(r1.status).toBe(200)

    const rec = await prisma.passwordReset.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
    expect(rec).toBeTruthy()

    const v1 = await VERIFY(req("http://localhost/api/auth/password/verify", { emailOrPhone: to, code: rec!.code }))
    expect(v1.status).toBe(200)
    const jwt = (await v1.json()).token

    const newPassword = "Aa1!aaaa"
    const rs = await RESET(req("http://localhost/api/auth/password/reset", { token: jwt, newPassword }))
    expect(rs.status).toBe(200)
    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    const ok = await comparePassword(newPassword, updated!.passwordHash)
    expect(ok).toBe(true)
  }, 30000)
})
