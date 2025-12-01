"use client"
import React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Topbar from "@/app/dashboard/components/Topbar"
import Sidebar from "@/app/dashboard/components/Sidebar"
import { usePathname, useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/app/dashboard/contexts/auth-context"
import { UIProvider, useUI } from "@/app/dashboard/contexts/ui-context"
import { StatusProvider } from "@/app/dashboard/contexts/status-context"

type UserRow = { id: string; name: string; email: string; createdAt: string; role: string; status?: "online" | "away" | "offline" }

function UsersDashboardContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { me, authChecked } = useAuth()
  const { sidebarOpen, setSidebarOpen, touchStartX, setTouchStartX } = useUI()

  const [users, setUsers] = useState<UserRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState("")
  const [emailFilter, setEmailFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const highlightRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = me?.role === "admin"
  useEffect(() => { if (authChecked && !isAdmin) router.replace("/login") }, [authChecked, isAdmin])

  const fetchUsers = async (p = 1) => {
    setLoading(true)
    try {
      const url = new URL("/api/users", window.location.origin)
      url.searchParams.set("page", String(p))
      url.searchParams.set("limit", "10")
      if (q) url.searchParams.set("q", q)
      if (emailFilter) url.searchParams.set("email", emailFilter)
      const res = await fetch(url.toString())
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || "Falha ao carregar usuários")
      const rows: UserRow[] = (json.data || []).map((u: any) => ({ id: String(u.id), name: String(u.name), email: String(u.email), createdAt: String(u.createdAt), role: String(u.role) }))
      setUsers(rows)
      setPage(json.page || 1)
      setTotalPages(json.totalPages || 1)
      // fetch statuses
      if (rows.length > 0) {
        const ids = rows.map((r) => r.id).join(",")
        const sres = await fetch(`/api/user/status?ids=${encodeURIComponent(ids)}`)
        const sjson = await sres.json().catch(() => ({ statuses: [] }))
        const map: Map<string, string> = new Map<string, string>((sjson.statuses || []).map((s: any) => [String(s.id), String(s.status || "offline")]))
        const rowsWithStatus = rows.map((r) => ({ ...r, status: (map.get(r.id) as "online" | "away" | "offline") ?? "offline" }))
        setUsers(rowsWithStatus)
      }
      // highlight newly created email
      try {
        const emailNew = localStorage.getItem("last_registered_email")
        if (emailNew) {
          const idx = rows.findIndex((r) => r.email === emailNew)
          if (idx >= 0) {
            const el = document.getElementById(`user-row-${rows[idx].id}`)
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" })
              el.classList.add("ring-2", "ring-blue-400", "bg-blue-900/20")
              setTimeout(() => el.classList.remove("ring-2", "ring-blue-400", "bg-blue-900/20"), 4000)
            }
          }
          localStorage.removeItem("last_registered_email")
        }
      } catch {}
    } catch (e: any) {
      console.error("users_ui_load_error", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(1) }, [])
  useEffect(() => { fetchUsers(1) }, [q, emailFilter])

  const doImpersonate = async (userId: string) => {
    if (!isAdmin) return
    const ok = window.confirm("Confirmar login automático em nova aba?")
    if (!ok) return
    try {
      const url = new URL("/api/auth/impersonate", window.location.origin)
      url.searchParams.set("userId", userId)
      const res = await fetch(url.toString())
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Falha ao gerar token")
      const token = String(json.token || "")
      console.info("admin_impersonate_click", { userId })
      window.open(`/auto-login?token=${encodeURIComponent(token)}`, "_blank")
    } catch (e: any) {
      console.error("admin_impersonate_error", e)
      alert(e?.message || "Erro ao realizar login automático")
    }
  }

  const renderStatus = (s?: string) => {
    const active = s === "online"
    return (
      <span className={`px-2 py-1 rounded text-xs ${active ? "bg-green-600 text-white" : "bg-slate-600 text-white"}`}>{active ? "Ativo" : "Inativo"}</span>
    )
  }

  const isAuthed = !!me && authChecked
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {isAuthed && (
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          me={{ name: me?.name ?? "", avatarUrl: me?.avatarUrl ?? undefined, role: me?.role ?? "" }}
          breadcrumb={"Dashboard / Usuários"}
          onLogout={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login") }}
        />
      )}
      {isAuthed && sidebarOpen && (
        <div aria-hidden="true" onClick={() => setSidebarOpen(false)} onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)} onTouchMove={(e) => { const x = e.touches[0]?.clientX ?? 0; if (touchStartX !== null && Math.abs(x - touchStartX) > 50) setSidebarOpen(false) }} className="fixed inset-0 top-14 md:hidden bg-black/50 z-30 transition-opacity duration-300" />
      )}
      <div className="flex">
        {isAuthed && (
          <Sidebar sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)} pathname={pathname} role={me?.role ?? ""} touchStartX={touchStartX} setTouchStartX={setTouchStartX} />
        )}
        <main className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] px-4 py-10 ${isAuthed && sidebarOpen ? "md:pl-64" : ""}`}>
          <div className="max-w-3xl mx-auto">
            <Image src="/Logo.jpg" alt="Logo" width={160} height={160} className="mx-auto rounded-full" />
            <h1 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-300 text-center">Painel Administrativo</h1>
            <p className="text-center text-slate-500 dark:text-slate-400">Gerencie todos os usuários registrados</p>

            <div className="mt-6 bg-slate-800 border border-slate-700 rounded p-4 flex flex-col md:flex-row gap-3 items-center">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou email..." className="bg-slate-700 border-slate-600 text-white flex-1" />
              <Input value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} placeholder="Filtrar por email..." className="bg-slate-700 border-slate-600 text-white flex-1" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-700 border border-slate-600 text-white rounded p-2">
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              <Button onClick={() => fetchUsers(1)} className="bg-blue-600 hover:bg-blue-700">Atualizar</Button>
            </div>

            <div className="mt-4 bg-slate-800 border border-slate-700 rounded overflow-hidden">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 text-slate-300">
                <div>ID do usuário</div>
                <div>Nome completo</div>
                <div>E-mail</div>
                <div>Data de criação</div>
                <div>Status</div>
                <div>Ações</div>
              </div>
              <div>
                {users.filter((u) => {
                  if (statusFilter === "active") return (u.status === "online")
                  if (statusFilter === "inactive") return (u.status !== "online")
                  return true
                }).map((u) => (
                  <div id={`user-row-${u.id}`} key={u.id} className="grid grid-cols-6 gap-2 px-4 py-2 border-t border-slate-700 items-center">
                    <div className="truncate text-slate-400">{u.id}</div>
                    <div className="text-white font-medium">{u.name}</div>
                    <div className="text-slate-300 truncate">{u.email}</div>
                    <div className="text-slate-300">{new Date(u.createdAt).toLocaleDateString()}</div>
                    <div>{renderStatus(u.status)}</div>
                    <div>
                      {isAdmin && (
                        <Button onClick={() => doImpersonate(u.id)} className="bg-slate-700 hover:bg-slate-600">Login Automático</Button>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="px-4 py-6 text-center text-slate-400">Nenhum usuário encontrado</div>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700">
                <div className="text-slate-400">Página {page} de {totalPages}</div>
                <div className="flex gap-2">
                  <Button disabled={page<=1} onClick={() => fetchUsers(page-1)} className="bg-slate-700">Anterior</Button>
                  <Button disabled={page>=totalPages} onClick={() => fetchUsers(page+1)} className="bg-slate-700">Próxima</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <AuthProvider>
      <UIProvider>
        <StatusProvider>
          <UsersDashboardContent />
        </StatusProvider>
      </UIProvider>
    </AuthProvider>
  )
}
