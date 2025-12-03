import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderToString } from "react-dom/server"
import React from "react"
vi.mock("@/app/dashboard/contexts/auth-context", () => ({
  useAuth: () => ({ me: { name: "Tester", avatarUrl: "", role: "admin" }, authChecked: true, logout: () => {} })
}))

const routes = ["/", "/dashboard", "/attendance", "/register", "/admin/users", "/admin/sessions"]

describe("AppShell across routes", () => {
  beforeEach(() => { vi.resetModules() })
  for (const path of routes) {
    it(`renders layout on ${path}`, async () => {
      vi.doMock("next/navigation", () => ({
        usePathname: () => path,
        useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
      }))
      const { default: Shell } = await import("@/components/shared/AppShell")
      const html = renderToString(<Shell><div>Conteúdo</div></Shell>)
      expect(html).toContain("Abrir menu")
      expect(html).toContain("Navegação lateral")
    })
  }
})
