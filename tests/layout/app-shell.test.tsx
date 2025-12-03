import { describe, it, expect, vi } from "vitest"
import { renderToString } from "react-dom/server"
import React from "react"

vi.mock("next/navigation", () => ({
  usePathname: () => "/attendance",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))
vi.mock("@/app/dashboard/contexts/auth-context", () => ({
  useAuth: () => ({ me: { name: "Tester", avatarUrl: "", role: "admin" }, authChecked: true, logout: () => {} })
}))

import AppShell from "@/components/shared/AppShell"

describe("AppShell layout", () => {
  it("renders Topbar and Sidebar on /attendance", () => {
    const html = renderToString(<AppShell><div>Conteúdo</div></AppShell>)
    expect(html).toContain("Abrir menu")
    expect(html).toContain("Navegação lateral")
    expect(html).toContain("Lista de Chamada")
  })

  it("marks current route in Sidebar", () => {
    const html = renderToString(<AppShell><div>Conteúdo</div></AppShell>)
    expect(html).toContain('aria-current="page"')
  })
})
