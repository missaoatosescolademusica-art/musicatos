"use client"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, UserPlus, Menu, UserCog, Home, LogOut } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { UIProvider, useUI } from "./contexts/ui-context"
import { AuthProvider, useAuth } from "./contexts/auth-context"
import { RegisterFormProvider, useRegisterForm } from "./contexts/register-form-context"

function RegisterPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, touchStartX, setTouchStartX } = useUI()
  const { me, authChecked } = useAuth()
  const { name, setName, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, show1, setShow1, show2, setShow2, role, setRole, loading, setLoading } = useRegisterForm()

  useEffect(() => {
    fetch("/api/auth/csrf").catch(() => {})
  }, [])

  // Auth fetch deslocado para AuthProvider

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarOpen")
      if (saved !== null) setSidebarOpen(saved === "true")
    } catch {}
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    try { localStorage.setItem("sidebarOpen", String(sidebarOpen)) } catch {}
  }, [sidebarOpen])

  const submit = async () => {
    setLoading(true)
    try {
      const csrf = getCookie("csrfToken")
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf || "" },
        body: JSON.stringify({ name, email, password, confirmPassword, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("Registro realizado")
      } else {
        toast.error(data.message || "Erro de validação")
      }
    } catch {
      toast.error("Erro de servidor")
    } finally {
      setLoading(false)
    }
  }

  const isAuthed = !!me && authChecked

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {isAuthed && (
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button aria-label="Abrir menu" aria-controls="app-sidebar" aria-expanded={sidebarOpen} className="p-2 rounded hover:bg-slate-800 transition" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-5 w-5 text-slate-300" />
              </button>
              <nav aria-label="Breadcrumb" className="text-slate-400 text-sm">Dashboard <span className="mx-1">/</span> Cadastrar Usuários</nav>
            </div>
            <div className="flex items-center gap-4">
              {me && (
                <div className="flex items-center gap-2" aria-label="Perfil do usuário">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center" aria-hidden>
                    {me.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-200 text-sm">{me.name}</span>
                </div>
              )}
              <Button variant="ghost" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login") }} aria-label="Sair" className="text-slate-300 hover:text-white"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
            </div>
          </div>
        </header>
      )}

      {isAuthed && sidebarOpen && (
        <div aria-hidden="true" onClick={() => setSidebarOpen(false)} onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)} onTouchMove={(e) => { const x = e.touches[0]?.clientX ?? 0; if (touchStartX !== null && Math.abs(x - touchStartX) > 50) setSidebarOpen(false) }} className="fixed inset-0 top-14 md:hidden bg-black/50 z-30 transition-opacity duration-300" />
      )}

      <div className="flex">
        {isAuthed && (
          <aside id="app-sidebar" aria-label="Navegação lateral" tabIndex={0} onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)} onTouchMove={(e) => { const x = e.touches[0]?.clientX ?? 0; if (touchStartX !== null && Math.abs(x - touchStartX) > 50) setSidebarOpen(false) }} className={`fixed md:static left-0 top-14 md:top-0 h-[calc(100vh-3.5rem)] md:h-auto w-64 transform transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} bg-slate-800 border-r border-slate-700 z-40`}>
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
              <Image src="/Logo.jpg" alt="Logo" width={36} height={36} className="rounded" />
              <span className="text-slate-200 font-semibold">Missão Atos</span>
            </div>
            <nav className="p-2 space-y-1">
              <Link href="/" className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${pathname === "/" ? "bg-slate-700 text-white" : "text-slate-300"}`} onClick={() => setSidebarOpen(false)} aria-current={pathname === "/" ? "page" : undefined}>
                <UserPlus className="h-4 w-4" />
                <span>Adicionar Estudante</span>
              </Link>
              {me?.role === "admin" && (
                <Link href="/register" className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${pathname === "/register" ? "bg-slate-700 text-white" : "text-slate-300"}`} onClick={() => setSidebarOpen(false)} aria-current={pathname === "/register" ? "page" : undefined}>
                  <UserCog className="h-4 w-4" />
                  <span>Cadastrar Usuários</span>
                </Link>
              )}
              <Link href="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${pathname === "/dashboard" ? "bg-slate-700 text-white" : "text-slate-300"}`} onClick={() => setSidebarOpen(false)} aria-current={pathname === "/dashboard" ? "page" : undefined}>
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </nav>
          </aside>
        )}

        <main className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 ${isAuthed && sidebarOpen ? "md:pl-64" : ""}`}>
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-semibold">Registrar</h1>
            </div>
            <div>
              <Label className="text-slate-300">Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-700 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-700 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Senha</Label>
              <div className="relative">
                <Input type={show1 ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-700 border-slate-600 text-white mt-1 pr-10" />
                <button type="button" onClick={() => setShow1(!show1)} className="absolute right-2 top-2.5 text-slate-300">
                  {show1 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Confirmar senha</Label>
              <div className="relative">
                <Input type={show2 ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-slate-700 border-slate-600 text-white mt-1 pr-10" />
                <button type="button" onClick={() => setShow2(!show2)} className="absolute right-2 top-2.5 text-slate-300">
                  {show2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Tipo de usuário</Label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-slate-700 border border-slate-600 text-white mt-1 rounded p-2 w-full">
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-slate-400 text-xs mt-1">Admin requer cabeçalho de convite válido</p>
            </div>
            <Button onClick={submit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? "Carregando..." : "Registrar"}</Button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <UIProvider>
        <RegisterFormProvider>
          <RegisterPageContent />
        </RegisterFormProvider>
      </UIProvider>
    </AuthProvider>
  )
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? match[2] : undefined
}
