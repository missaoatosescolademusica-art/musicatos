"use client"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"

type Props = {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  me: { name: string; role: string } | null
  onLogout: () => void
  breadcrumb: string
}

function Topbar({ sidebarOpen, onToggleSidebar, me, onLogout, breadcrumb }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button aria-label="Abrir menu" aria-controls="app-sidebar" aria-expanded={sidebarOpen} className="p-2 rounded hover:bg-slate-800 transition" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5 text-slate-300" />
          </button>
          <nav aria-label="Breadcrumb" className="text-slate-400 text-sm">{breadcrumb}</nav>
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
          <Button variant="ghost" onClick={onLogout} aria-label="Sair" className="text-slate-300 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Topbar

