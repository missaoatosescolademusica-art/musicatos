"use client"
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner"
import Image from "next/image"
import { UIProvider, useUI } from "@/app/dashboard/contexts/ui-context";
import { AuthProvider, useAuth } from "@/app/dashboard/contexts/auth-context";
import {
  RegisterFormProvider,
  useRegisterForm,
} from "./contexts/register-form-context";
import FloatingAttendanceFAB from "@/components/attendance/FloatingAttendanceFAB";
import Topbar from "@/app/dashboard/components/Topbar";
import Sidebar from "@/app/dashboard/components/Sidebar";
import { StatusProvider } from "@/app/dashboard/contexts/status-context";

function RegisterPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, touchStartX, setTouchStartX } = useUI();
  const { me, authChecked } = useAuth();
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    show1,
    setShow1,
    show2,
    setShow2,
    role,
    setRole,
    loading,
    setLoading,
  } = useRegisterForm();

  useEffect(() => {
    fetch("/api/auth/csrf").catch(() => {});
  }, []);

  // Auth fetch deslocado para AuthProvider

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

  const submit = async () => {
    setLoading(true);
    try {
      const csrf = getCookie("csrfToken");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf || "",
        },
        body: JSON.stringify({ name, email, password, confirmPassword, role }),
      });
      const ct = res.headers.get("content-type") || "";
      if (res.redirected) {
        try {
          localStorage.removeItem("user_avatar");
          localStorage.removeItem("user_id");
          localStorage.setItem("last_registered_email", email);
        } catch {}
        const next = me?.role === "admin" ? "/admin/users" : res.url;
        window.location.replace(next);
        return;
      }
      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          try {
            localStorage.removeItem("user_avatar");
            localStorage.removeItem("user_id");
            localStorage.setItem("last_registered_email", email);
          } catch {}
          const next = me?.role === "admin" ? "/admin/users" : "/dashboard";
          window.location.replace(next);
        } else {
          toast.error(data.message || "Erro de validação");
        }
      } else {
        if (res.ok) {
          try {
            localStorage.removeItem("user_avatar");
            localStorage.removeItem("user_id");
            localStorage.setItem("last_registered_email", email);
          } catch {}
          const next = me?.role === "admin" ? "/admin/users" : "/dashboard";
          window.location.replace(next);
        } else {
          toast.error("Erro de servidor");
        }
      }
    } catch {
      toast.error("Erro de servidor");
    } finally {
      setLoading(false);
    }
  };

  const isAuthed = !!me && authChecked;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {isAuthed && (
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          me={{
            name: me?.name ?? "",
            avatarUrl: me?.avatarUrl ?? undefined,
            role: me?.role ?? "",
          }}
          onLogout={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          breadcrumb={"Dashboard / Cadastrar Usuários"}
        />
      )}

      {isAuthed && sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
          onTouchMove={(e) => {
            const x = e.touches[0]?.clientX ?? 0;
            if (touchStartX !== null && Math.abs(x - touchStartX) > 50)
              setSidebarOpen(false);
          }}
          className="fixed inset-0 top-14 md:hidden bg-black/50 z-30 transition-opacity duration-300"
        />
      )}

      <div className="flex">
        {isAuthed && (
          <Sidebar
            sidebarOpen={sidebarOpen}
            onCloseSidebar={() => setSidebarOpen(false)}
            pathname={pathname}
            role={me?.role ?? ""}
            touchStartX={touchStartX}
            setTouchStartX={setTouchStartX}
          />
        )}

        <main
          className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10 ${
            isAuthed && sidebarOpen ? "md:pl-64" : ""
          }`}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-6 space-y-4">
            <Image
              src="/Logo.jpg"
              alt="Logo"
              width={128}
              height={128}
              className="mx-auto rounded-full"
            />
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl text-slate-900 dark:text-slate-300 font-semibold">
                Registrar
              </h1>
            </div>
            <div>
              <Label className="text-slate-900 dark:text-slate-300">
                Nome completo
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-900 dark:text-slate-300">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-900 dark:text-slate-300">
                Senha
              </Label>
              <div className="relative">
                <Input
                  type={show1 ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow1(!show1)}
                  className="absolute right-2 top-2.5 text-slate-300"
                >
                  {show1 ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-slate-900 dark:text-slate-300">
                Confirmar senha
              </Label>
              <div className="relative">
                <Input
                  type={show2 ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow2(!show2)}
                  className="absolute right-2 top-2.5 text-slate-300"
                >
                  {show2 ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-slate-900 dark:text-slate-300">
                Tipo de usuário
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white mt-1 rounded p-2 w-full"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
                <option value="professor">Professor</option>
              </select>
              <p className="text-slate-800 dark:text-slate-400 text-xs mt-1">
                Admin requer cabeçalho de convite válido
              </p>
            </div>
            <Button
              onClick={submit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Carregando..." : "Registrar"}
            </Button>
          </div>
        </main>
      </div>
      {isAuthed && <FloatingAttendanceFAB />}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <UIProvider>
        <StatusProvider>
          <RegisterFormProvider>
            <RegisterPageContent />
          </RegisterFormProvider>
        </StatusProvider>
      </UIProvider>
    </AuthProvider>
  );
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? match[2] : undefined
}
