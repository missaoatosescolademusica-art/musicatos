"use client"
import { Menu } from "lucide-react";
import AvatarMenu from "./AvatarMenu";

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  me: { name: string; avatarUrl: string | undefined; role: string } | null;
  onLogout: () => void;
  breadcrumb: string;
};

function Topbar({
  sidebarOpen,
  onToggleSidebar,
  me,
  onLogout,
  breadcrumb,
}: Props) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            aria-label="Abrir menu"
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
            className="p-2 rounded hover:bg-slate-800 transition"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </button>
          <nav aria-label="Breadcrumb" className="text-slate-400 text-sm">
            {breadcrumb}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <AvatarMenu
            name={me?.name}
            avatarUrl={me?.avatarUrl || undefined}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
