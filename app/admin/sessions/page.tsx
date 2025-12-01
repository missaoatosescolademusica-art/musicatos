"use client"
import React, { useEffect, useState } from "react"
import Topbar from "@/app/dashboard/components/Topbar"
import Sidebar from "@/app/dashboard/components/Sidebar"
import { useAuth } from "@/app/dashboard/contexts/auth-context"
import { UIProvider, useUI } from "@/app/dashboard/contexts/ui-context"
import { AuthProvider } from "@/app/dashboard/contexts/auth-context"
import { StatusProvider } from "@/app/dashboard/contexts/status-context"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type SessionRow = { jti: string; adminId: string; userId: string; role: string; issuedAt: number; expiresAt: number; revoked: boolean }

function SessionsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { me, authChecked } = useAuth()
  const { sidebarOpen, setSidebarOpen, touchStartX, setTouchStartX } = useUI()
  const [rows, setRows] = useState<SessionRow[]>([])
  const [adminId, setAdminId] = useState("")
  const [userId, setUserId] = useState("")
  const isAdmin = me?.role === "admin"
  useEffect(() => { if (authChecked && !isAdmin) router.replace("/login") }, [authChecked, isAdmin])

  const load = async () => {
    const url = new URL("/api/auth/impersonate/sessions", window.location.origin)
    if (adminId) url.searchParams.set("adminId", adminId)
    if (userId) url.searchParams.set("userId", userId)
    const res = await fetch(url.toString())
    const json = await res.json().catch(() => ({ sessions: [] }))
    if (res.ok) setRows(json.sessions || [])
  }
  useEffect(() => { load() }, [])
  useEffect(() => { load() }, [adminId, userId])

  const revoke = async (jti: string) => {
    if (!confirm("Revogar sessão agora?")) return
    const res = await fetch("/api/auth/impersonate/revoke", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jti }) })
    await res.json().catch(() => ({}))
    await load()
  }
  const revokeAll = async () => {
    if (!confirm("Revogar todas as sessões conforme filtro atual?")) return
    const res = await fetch("/api/auth/impersonate/revoke-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminId: adminId || undefined, userId: userId || undefined }) })
    await res.json().catch(() => ({}))
    await load()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {me && (
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          me={{ name: me?.name ?? "", avatarUrl: me?.avatarUrl ?? undefined, role: me?.role ?? "" }}
          breadcrumb={"Dashboard / Sessões Ativas"}
          onLogout={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login") }}
        />
      )}
      {me && sidebarOpen && (
        <div aria-hidden="true" onClick={() => setSidebarOpen(false)} onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)} onTouchMove={(e) => { const x = e.touches[0]?.clientX ?? 0; if (touchStartX !== null && Math.abs(x - touchStartX) > 50) setSidebarOpen(false) }} className="fixed inset-0 top-14 md:hidden bg-black/50 z-30 transition-opacity duration-300" />
      )}
      <div className="flex">
        {me && (
          <Sidebar sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)} pathname={pathname} role={me?.role ?? ""} touchStartX={touchStartX} setTouchStartX={setTouchStartX} />
        )}
        <main className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] px-4 py-10 ${me && sidebarOpen ? "md:pl-64" : ""}`}>
          <div className="max-w-3xl mx-auto">
            <h1 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-300 text-center">Sessões Ativas</h1>
            <p className="text-center text-slate-500 dark:text-slate-400">Gerencie impersonates emitidos</p>
            <div className="mt-6 bg-slate-800 border border-slate-700 rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <input value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="Filtrar por adminId" className="bg-slate-700 border-slate-600 text-white rounded p-2" />
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Filtrar por userId" className="bg-slate-700 border-slate-600 text-white rounded p-2" />
              <Button onClick={() => load()} className="bg-blue-600 hover:bg-blue-700">Atualizar</Button>
              <Button onClick={revokeAll} className="bg-destructive">Revogar tudo</Button>
            </div>
            <div className="mt-4 bg-slate-800 border border-slate-700 rounded overflow-hidden">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 text-slate-300">
                <div>JTI</div>
                <div>Admin</div>
                <div>Usuário</div>
                <div>Role</div>
                <div>Status</div>
                <div>Ações</div>
              </div>
              {rows.map((r) => (
                <div key={r.jti} className="grid grid-cols-6 gap-2 px-4 py-2 border-t border-slate-700 items-center">
                  <div className="truncate text-slate-400">{r.jti}</div>
                  <div className="text-slate-300 truncate">{r.adminId}</div>
                  <div className="text-slate-300 truncate">{r.userId}</div>
                  <div className="text-slate-300">{r.role}</div>
                  <div>
                    {r.revoked ? (
                      <span className="px-2 py-1 rounded text-xs bg-red-600 text-white">revogado/expirado</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">ativo até {new Date(r.expiresAt).toLocaleString()}</span>
                    )}
                  </div>
                  <div>
                    <Button disabled={r.revoked} onClick={() => revoke(r.jti)} className="bg-destructive">Revogar</Button>
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-400">Nenhuma sessão ativa</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  return (
    <AuthProvider>
      <UIProvider>
        <StatusProvider>
          <SessionsContent />
        </StatusProvider>
      </UIProvider>
    </AuthProvider>
  )
}
