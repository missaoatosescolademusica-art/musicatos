import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/resources/openapi/route"

describe("resources openapi", () => {
  it("returns JSON spec", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.openapi).toBe("3.0.3")
    expect(j.paths["/api/resources"]).toBeTruthy()
  })
})
