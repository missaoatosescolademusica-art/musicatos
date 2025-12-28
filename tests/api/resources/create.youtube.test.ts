import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/resources/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

function req(url: string, role: string, body: any) {
  const headers = new Headers({ "content-type": "application/json", cookie: `auth=${generateJwt({ sub: `res-${role}`, role })}` })
  return new NextRequest(new Request(url, { method: "POST", headers, body: JSON.stringify(body) }))
}

describe("resources create youtube", () => {
  it("creates and prevents duplicate", async () => {
    const role = await prisma.role.findUnique({ where: { name: "admin" } }) || await prisma.role.create({ data: { name: "admin" } })
    await prisma.user.upsert({ where: { id: "res-admin" }, update: {}, create: { id: "res-admin", name: "Admin", email: `adm_${Date.now()}@x.com`, passwordHash: "x", roleId: (await prisma.role.findUnique({ where: { name: "admin" } }))!.id } })
    const id = Math.random().toString(36).slice(2, 13).padEnd(11, "0");
    const url = `https://www.youtube.com/watch?v=${id}`;
    const r1 = await POST(
      req("http://localhost/api/resources", "admin", {
        url,
        categoryPath: "Music Theory",
      })
    );
    expect(r1.status).toBe(201)
    const json = await r1.json();
    expect(json.resource.categoryPath).toBe("Music Theory");
    
    const r2 = await POST(req("http://localhost/api/resources", "admin", { url }))
    expect(r2.status).toBe(409)
  })
})
