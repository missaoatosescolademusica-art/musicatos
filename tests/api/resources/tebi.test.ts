import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/resources/route"
import { prisma } from "@/lib/db"
import { generateJwt } from "@/lib/auth"

// Mock TebiClient
vi.mock("@/lib/tebi", () => {
  return {
    uploadToTebi: vi.fn().mockResolvedValue({
      key: "resources/test.pdf",
      url: "https://s3.tebi.io/bucket/resources/test.pdf"
    })
  }
})

function req(url: string, role: string, body: FormData) {
  const headers = new Headers({ cookie: `auth=${generateJwt({ sub: `res-tebi-${role}`, role })}` })
  return new NextRequest(new Request(url, { method: "POST", headers, body }))
}

describe("resources tebi integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.TEBI_API_KEY = "mock_key"
    await prisma.resource.deleteMany({ where: { tebiId: "resources/test.pdf" } })
  })

  it("uploads to tebi and saves metadata", async () => {
    // Setup User
    const role = await prisma.role.findFirst({ where: { name: "admin" } }) || await prisma.role.create({ data: { name: "admin" } })
    await prisma.user.upsert({ 
        where: { id: "res-tebi-admin" }, 
        update: {}, 
        create: { id: "res-tebi-admin", name: "AdminTebi", email: `tebi_${Date.now()}@x.com`, passwordHash: "x", roleId: role.id } 
    })

    const fd = new FormData()
    const name = `tebi_${Date.now()}.pdf`
    fd.append("file", new File([new Blob(["content"], { type: "application/pdf" })], name, { type: "application/pdf" }))
    
    const res = await POST(req("http://localhost/api/resources", "admin", fd))
    expect(res.status).toBe(201)
    
    const json = await res.json()
    expect(json.resource.tebiId).toBe("resources/test.pdf")
    expect(json.resource.tebiUrl).toBe("https://s3.tebi.io/bucket/resources/test.pdf")
    
    // Check DB
    const dbItem = await prisma.resource.findUnique({ where: { id: json.resource.id } })
    expect(dbItem?.tebiId).toBe("resources/test.pdf")
  })
})
