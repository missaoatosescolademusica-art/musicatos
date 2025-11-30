import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { GET, POST } from "@/app/api/attendance/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function reqWithCookie(url: string, options: any = {}) {
  const token = generateJwt({ sub: "test-user", role: "admin" })
  const headers = new Headers(options.headers || {})
  headers.set("cookie", `auth=${token}`)
  const req = new Request(url, { ...options, headers })
  return new NextRequest(req)
}

function todayStr() {
  const d = new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`
}

describe("attendance roster api", () => {
  it("lists all registered students and marks one present", async () => {
    const role = await prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } })
    await prisma.user.upsert({ where: { id: "test-user" }, update: {}, create: { id: "test-user", name: "Tester", email: `tester_${Date.now()}@example.com`, passwordHash: "x", roleId: role.id } })
    const nameA = `Aluno A ${Date.now()}`
    const nameB = `Aluno B ${Date.now()}`
    const a = await prisma.student.create({ data: { fullName: nameA, nameFather: "Pai A", nameMother: "Mae A", phone: "000", address: "Rua 1", instruments: [], available: true } })
    const b = await prisma.student.create({ data: { fullName: nameB, nameFather: "Pai B", nameMother: "Mae B", phone: "111", address: "Rua 2", instruments: [], available: true, createdAt: new Date(Date.now() - 365*24*60*60*1000) } })

    const resList = await GET(reqWithCookie(`http://localhost/api/attendance?mode=roster&page=1&limit=50&q=Aluno`))
    const jsonList: any = await resList.json()
    expect(resList.status).toBe(200)
    const names = jsonList.data.map((x: any) => x.student.fullName)
    expect(names).toContain(nameA)
    expect(names).toContain(nameB)

    const resPost = await POST(reqWithCookie(`http://localhost/api/attendance`, { method: "POST", body: JSON.stringify({ studentId: a.id, status: "PRESENT" }) }))
    expect(resPost.status).toBe(201)

    const d = todayStr()
    const resRoster = await GET(reqWithCookie(`http://localhost/api/attendance?mode=roster&date=${d}&page=1&limit=50&q=Aluno`))
    const jsonRoster: any = await resRoster.json()
    const itemA = jsonRoster.data.find((x: any) => x.student.fullName === nameA)
    const itemB = jsonRoster.data.find((x: any) => x.student.fullName === nameB)
    expect(itemA.status).toBe("PRESENT")
    expect(itemB.status).toBe(null)

    const resPresent = await GET(reqWithCookie(`http://localhost/api/attendance?mode=roster&date=${d}&status=PRESENT&page=1&limit=50&q=Aluno`))
    const jsonPresent: any = await resPresent.json()
    expect(jsonPresent.data.length).toBeGreaterThanOrEqual(1)

    const resUnmarked = await GET(reqWithCookie(`http://localhost/api/attendance?mode=roster&date=${d}&status=UNMARKED&page=1&limit=50&q=Aluno`))
    const jsonUnmarked: any = await resUnmarked.json()
    expect(jsonUnmarked.data.find((x: any) => x.student.fullName === nameB)).toBeTruthy()
  }, 15000)
})
