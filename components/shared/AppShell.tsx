"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Topbar from "@/app/dashboard/components/Topbar"
import Sidebar from "@/app/dashboard/components/Sidebar"
import { useAuth } from "@/app/dashboard/contexts/auth-context"
import { useStatus } from "@/app/dashboard/contexts/status-context"
import { logout } from "@/app/dashboard/helper/handles"
import SiteFooter from "@/components/shared/SiteFooter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { me, authChecked } = useAuth()
  const { markActive, register, unregister } = useStatus(me?.id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const onToggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])
  const onCloseSidebar = useCallback(() => setSidebarOpen(false), [])

 useEffect(() => {
   try {
     const saved = localStorage.getItem("sidebarOpen");
     if (saved !== null) setSidebarOpen(saved === "true");
   } catch {}
   const onKey = (e: KeyboardEvent) => {
     if (e.key === "Escape") setSidebarOpen(false);
   };
   window.addEventListener("keydown", onKey);
   return () => window.removeEventListener("keydown", onKey);
 }, []);

 useEffect(() => {
   try {
     localStorage.setItem("sidebarOpen", String(sidebarOpen));
   } catch {}
 }, [sidebarOpen]);

  useEffect(() => {
    if (!authChecked || !me?.id) return
    register(me.id)
    let last = 0
    const onMove = () => {
      const now = Date.now()
      if (now - last > 1000) { // throttle 1s
        last = now
        markActive(me.id)
      }
    }
    window.addEventListener("mousemove", onMove)
    return () => {
      window.removeEventListener("mousemove", onMove)
      unregister(me.id)
    }
  }, [authChecked, me?.id])

  const breadcrumb = useMemo(() => {
    if (!pathname) return ""
    switch (pathname) {
      case "/":
        return "Início"
      case "/dashboard":
        return "Dashboard"
      case "/attendance":
        return "Lista de Chamada"
      case "/register":
        return "Cadastro de Usuários"
      case "/admin/users":
        return "Admin / Usuários"
      case "/admin/sessions":
        return "Admin / Sessões"
      default:
        return pathname
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {authChecked && me && (
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={onToggleSidebar}
          me={{ name: me.name, avatarUrl: me.avatarUrl, role: me.role }}
          onLogout={() => logout((path) => router.push(path))}
          breadcrumb={breadcrumb}
        />
      )}
      {(!authChecked || !me) && (
        <div
          className="sticky top-0 z-40 h-14 bg-slate-900/20 backdrop-blur border-b border-slate-800"
          aria-hidden="true"
        />
      )}
      {authChecked && me && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          onCloseSidebar={onCloseSidebar}
          pathname={pathname || "/"}
          role={me.role}
          touchStartX={touchStartX}
          setTouchStartX={setTouchStartX}
        />
      )}
      <div className="max-w-7xl md:max-w-full mx-auto md:px-0 md:py-0 px-4 py-6">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
