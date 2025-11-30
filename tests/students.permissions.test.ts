import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { GET as GET_STUDENTS, POST as POST_STUDENTS } from "@/app/api/students/route"
import { GET as GET_STUDENT, PUT as PUT_STUDENT, DELETE as DELETE_STUDENT } from "@/app/api/students/[id]/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function reqWithCookie(url: string, role: string, options: any = {}) {
  const token = generateJwt({ sub: `test-${role}`, role })
  const headers = new Headers(options.headers || {})
  headers.set("cookie", `auth=${token}`)
  const req = new Request(url, { ...options, headers })
  return new NextRequest(req)
}

describe("students permissions", () => {
  it("forbids delete for professor and allows for admin", async () => {
    const roleAdmin = await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    const roleProf = await prisma.role.upsert({ where: { name: "professor" }, update: {}, create: { name: "professor" } })
    await prisma.user.upsert({ where: { id: "test-admin" }, update: {}, create: { id: "test-admin", name: "Admin", email: `admin_${Date.now()}@test.com`, passwordHash: "x", roleId: roleAdmin.id } })
    await prisma.user.upsert({ where: { id: "test-professor" }, update: {}, create: { id: "test-professor", name: "Prof", email: `prof_${Date.now()}@test.com`, passwordHash: "x", roleId: roleProf.id } })

    const s = await prisma.student.create({ data: { fullName: "Aluno X", nameFather: "Pai", nameMother: "Mae", phone: "000", address: "Rua", instruments: ["Violão"], available: true } })

    const resProfDel = await DELETE_STUDENT(reqWithCookie(`http://localhost/api/students/${s.id}`, "professor", { method: "DELETE" }), { params: { id: s.id } })
    expect(resProfDel.status).toBe(403)

    const resAdminDel = await DELETE_STUDENT(reqWithCookie(`http://localhost/api/students/${s.id}`, "admin", { method: "DELETE" }), { params: { id: s.id } })
    expect(resAdminDel.status).toBe(200)
  }, 15000)

  it("allows professor to edit and create, requires auth for list", async () => {
    const roleProf = await prisma.role.upsert({ where: { name: "professor" }, update: {}, create: { name: "professor" } })
    await prisma.user.upsert({ where: { id: "test-professor" }, update: {}, create: { id: "test-professor", name: "Prof", email: `prof2_${Date.now()}@test.com`, passwordHash: "x", roleId: roleProf.id } })

    const s = await prisma.student.create({ data: { fullName: "Aluno Y", nameFather: "Pai", nameMother: "Mae", phone: "111", address: "Rua 2", instruments: ["Canto"], available: true } })

    const resEdit = await PUT_STUDENT(reqWithCookie(`http://localhost/api/students/${s.id}`, "professor", { method: "PUT", body: JSON.stringify({ phone: "222" }) }), { params: { id: s.id } })
    expect(resEdit.status).toBe(200)

    const resCreate = await POST_STUDENTS(reqWithCookie("http://localhost/api/students", "professor", { method: "POST", body: JSON.stringify({ fullName: "Aluno Z", nameFather: "Pai Z", nameMother: "Mae Z", phone: "333", address: "Rua 3", instruments: ["Teclado"], available: true }) }))
    expect(resCreate.status).toBe(201)

    const resListNoAuth = await GET_STUDENTS(new NextRequest(new Request("http://localhost/api/students")))
    expect(resListNoAuth.status).toBe(401)
  }, 15000)
})
