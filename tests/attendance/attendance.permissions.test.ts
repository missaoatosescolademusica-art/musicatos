import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/attendance/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function reqWithCookie(url: string, role: string, options: any = {}) {
  const token = generateJwt({ sub: `att-${role}`, role })
  const headers = new Headers(options.headers || {})
  headers.set("cookie", `auth=${token}`)
  const req = new Request(url, { ...options, headers })
  return new NextRequest(req)
}

describe("attendance permissions", () => {
  it("forbids POST for user and allows for professor", async () => {
    const roleUser = await prisma.role.upsert({ where: { name: "user" }, update: {}, create: { name: "user" } })
    const roleProf = await prisma.role.upsert({ where: { name: "professor" }, update: {}, create: { name: "professor" } })
    await prisma.user.upsert({ where: { id: "att-user" }, update: {}, create: { id: "att-user", name: "User", email: `user_${Date.now()}@test.com`, passwordHash: "x", roleId: roleUser.id } })
    await prisma.user.upsert({ where: { id: "att-professor" }, update: {}, create: { id: "att-professor", name: "Prof", email: `prof_${Date.now()}@test.com`, passwordHash: "x", roleId: roleProf.id } })

    const student = await prisma.student.create({ data: { fullName: "Aluno A", nameFather: "Pai", nameMother: "Mae", phone: "000", address: "Rua", instruments: ["Violão"], available: true } })

    const resUser = await POST(reqWithCookie("http://localhost/api/attendance", "user", { method: "POST", body: JSON.stringify({ studentId: student.id, status: "PRESENT" }) }))
    expect(resUser.status).toBe(403)

    const resProf = await POST(reqWithCookie("http://localhost/api/attendance", "professor", { method: "POST", body: JSON.stringify({ studentId: student.id, status: "PRESENT" }) }))
    expect(resProf.status).toBe(201)
  }, 15000)
})
