"use client"
import Link from "next/link"
import Image from "next/image"
import { Home, UserCog, UserPlus } from "lucide-react"

type Props = {
  sidebarOpen: boolean
  onCloseSidebar: () => void
  pathname: string
  isAdmin: boolean
  touchStartX: number | null
  setTouchStartX: (v: number | null) => void
}

function Sidebar({ sidebarOpen, onCloseSidebar, pathname, isAdmin, touchStartX, setTouchStartX }: Props) {
  return (
    <aside
      id="app-sidebar"
      aria-label="Navegação lateral"
      tabIndex={0}
      onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
      onTouchMove={(e) => {
        const x = e.touches[0]?.clientX ?? 0
        if (touchStartX !== null && Math.abs(x - touchStartX) > 50) onCloseSidebar()
      }}
      className={`fixed md:static left-0 top-14 md:top-0 h-[calc(100vh-3.5rem)] md:h-auto w-64 transform transition-transform duration-300 ease-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } bg-slate-800 border-r border-slate-700 z-40`}
    >
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <Image src="/Logo.jpg" alt="Logo" width={36} height={36} className="rounded" />
        <span className="text-slate-200 font-semibold">Missão Atos</span>
      </div>
      <nav className="p-2 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${
            pathname === "/" ? "bg-slate-700 text-white" : "text-slate-300"
          }`}
          onClick={onCloseSidebar}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <UserPlus className="h-4 w-4" />
          <span>Adicionar Estudante</span>
        </Link>
        {isAdmin && (
          <Link
            href="/register"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${
              pathname === "/register" ? "bg-slate-700 text-white" : "text-slate-300"
            }`}
            onClick={onCloseSidebar}
            aria-current={pathname === "/register" ? "page" : undefined}
          >
            <UserCog className="h-4 w-4" />
            <span>Cadastrar Usuários</span>
          </Link>
        )}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${
            pathname === "/dashboard" ? "bg-slate-700 text-white" : "text-slate-300"
          }`}
          onClick={onCloseSidebar}
          aria-current={pathname === "/dashboard" ? "page" : undefined}
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      </nav>
    </aside>
  )
}

export default Sidebar

