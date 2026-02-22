"use client";
import Link from "next/link";
import Image from "next/image";
import { Hammer, Home, UserCog, UserPlus } from "lucide-react";

type Props = {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  pathname: string;
  role: string;
  touchStartX: number | null;
  setTouchStartX: (v: number | null) => void;
};

function Sidebar({
  sidebarOpen,
  onCloseSidebar,
  pathname,
  role,
  touchStartX,
  setTouchStartX,
}: Props) {
  return (
    <aside
      id="app-sidebar"
      aria-label="Navegação lateral"
      tabIndex={0}
      onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
      onTouchMove={(e) => {
        const x = e.touches[0]?.clientX ?? 0;
        if (touchStartX !== null && Math.abs(x - touchStartX) > 50)
          onCloseSidebar();
      }}
      className={`fixed md:fixed left-0 top-14 md:top-14 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] w-64 transform transition-transform duration-300 ease-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } bg-sidebar border-r border-sidebar-border z-40`}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center gap-2">
        <Image
          src="/Logo.jpg"
          alt="Logo"
          width={36}
          height={36}
          className="rounded"
        />
        <span className="text-sidebar-foreground font-semibold">
          Missão Atos
        </span>
      </div>
      <nav className="p-2 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
            pathname === "/"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80"
          }`}
          onClick={onCloseSidebar}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <UserPlus className="h-4 w-4" />
          <span>Adicionar Estudante</span>
        </Link>
        <Link
          href="/resources"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
            pathname === "/resources"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80"
          }`}
          onClick={onCloseSidebar}
          aria-current={pathname === "/resources" ? "page" : undefined}
        >
          <Hammer className="h-4 w-4" />
          <span>Recursos</span>
        </Link>
        {role === "admin" && (
          <Link
            href="/register"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
              pathname === "/register"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80"
            }`}
            onClick={onCloseSidebar}
            aria-current={pathname === "/register" ? "page" : undefined}
          >
            <UserCog className="h-4 w-4" />
            <span>Cadastrar Usuários</span>
          </Link>
        )}
        {role === "admin" && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
              pathname === "/admin/users"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80"
            }`}
            onClick={onCloseSidebar}
            aria-current={pathname === "/admin/users" ? "page" : undefined}
          >
            <UserCog className="h-4 w-4" />
            <span>Usuários</span>
          </Link>
        )}
        {role === "admin" && (
          <Link
            href="/admin/sessions"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
              pathname === "/admin/sessions"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80"
            }`}
            onClick={onCloseSidebar}
            aria-current={pathname === "/admin/sessions" ? "page" : undefined}
          >
            <UserCog className="h-4 w-4" />
            <span>Sessões</span>
          </Link>
        )}
        <Link
          href="/attendance"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
            pathname === "/attendance"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80"
          }`}
          onClick={onCloseSidebar}
          aria-current={pathname === "/attendance" ? "page" : undefined}
        >
          <Home className="h-4 w-4" />
          <span>Lista de Chamada</span>
        </Link>
        {(role === "professor" || role === "admin") && (
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition ${
              pathname === "/dashboard"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80"
            }`}
            onClick={onCloseSidebar}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
