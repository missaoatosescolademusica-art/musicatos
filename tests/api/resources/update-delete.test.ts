import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST as CREATE } from "@/app/api/resources/route"
import { PUT, DELETE, GET } from "@/app/api/resources/[id]/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function req(url: string, role: string, options: any = {}) {
  const headers = new Headers(options.headers || {})
  headers.set("cookie", `auth=${generateJwt({ sub: `res-${role}`, role })}`)
  const req = new Request(url, { ...options, headers })
  return new NextRequest(req)
}

describe("resources update and delete", () => {
  it("updates name and deletes file resource", async () => {
    const role = await prisma.role.findUnique({ where: { name: "admin" } }) || await prisma.role.create({ data: { name: "admin" } })
    await prisma.user.upsert({ where: { id: "res-admin" }, update: {}, create: { id: "res-admin", name: "Admin", email: `adm_${Date.now()}@x.com`, passwordHash: "x", roleId: role.id } })

    const fdOk = new FormData()
    const name = `ud_${Date.now()}.pdf`
    fdOk.append("file", new File([new Blob([new Uint8Array([1,2,3,4,5,6])], { type: "application/pdf" })], name, { type: "application/pdf" }))
    const created = await CREATE(req("http://localhost/api/resources", "admin", { method: "POST", body: fdOk }))
    const j = await created.json()
    const id = j.resource.id

    const put = await PUT(req(`http://localhost/api/resources/${id}`, "admin", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ originalName: "novo.pdf" }) }), { params: { id } })
    expect(put.status).toBe(200)
    const get = await GET(req(`http://localhost/api/resources/${id}`, "admin"), { params: { id } })
    const gj = await get.json()
    expect(gj.resource.originalName).toBe("novo.pdf")
    const del = await DELETE(req(`http://localhost/api/resources/${id}`, "admin", { method: "DELETE" }), { params: { id } })
    expect(del.status).toBe(200)
  })
})
