import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/resources/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function req(url: string, role: string, body: FormData) {
  const headers = new Headers({ cookie: `auth=${generateJwt({ sub: `res-${role}`, role })}` })
  return new NextRequest(new Request(url, { method: "POST", headers, body }))
}

describe("resources upload", () => {
  it("rejects invalid type and oversize; accepts valid pdf", async () => {
    const role = await prisma.role.findUnique({ where: { name: "admin" } }) || await prisma.role.create({ data: { name: "admin" } })
    await prisma.user.upsert({ where: { id: "res-admin" }, update: {}, create: { id: "res-admin", name: "Admin", email: `adm_${Date.now()}@x.com`, passwordHash: "x", roleId: role.id } })

    const fdBad = new FormData()
    fdBad.append("file", new File([new Blob(["x"], { type: "text/plain" })], "a.txt", { type: "text/plain" }))
    const rBad = await POST(req("http://localhost/api/resources", "admin", fdBad))
    expect(rBad.status).toBe(400)

    const big = new Uint8Array(10 * 1024 * 1024 + 1)
    const fdBig = new FormData()
    fdBig.append("file", new File([new Blob([big], { type: "application/pdf" })], "big.pdf", { type: "application/pdf" }))
    const rBig = await POST(req("http://localhost/api/resources", "admin", fdBig))
    expect(rBig.status).toBe(400)

    const fdOk = new FormData()
    const name = `u_${Date.now()}.pdf`
    fdOk.append("file", new File([new Blob([new Uint8Array([1,2,3,4,5])], { type: "application/pdf" })], name, { type: "application/pdf" }))
    const rOk = await POST(req("http://localhost/api/resources", "admin", fdOk))
    expect(rOk.status).toBe(201)
  })
})
