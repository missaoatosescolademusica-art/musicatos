"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/multi-select"
import { toast } from "sonner"
import { Music, Menu, UserPlus, UserCog, Home, LogOut } from "lucide-react"
import Image from "next/image";

const INSTRUMENTS = ["Violão", "Canto", "Teclado", "Bateria"];

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    instruments: [] as string[],
    available: true,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setMe({ name: data.name, role: data.role });
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

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

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) {
      return cleaned;
    }

    if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }

    if (cleaned.length <= 12) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} - ${cleaned.slice(
        7
      )}`;
    }

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} - ${cleaned.slice(
      7,
      12
    )}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleInstrumentsChange = (selected: string[]) => {
    setFormData({ ...formData, instruments: selected });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address
    ) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (formData.instruments.length === 0) {
      toast.error("Selecione pelo menos um instrumento");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.log(response);
        const error = await response.json();
        throw new Error(error.message || "Erro ao registrar estudante");
      }

      toast.success("Estudante registrado com sucesso!");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        instruments: [],
        available: true,
      });
      // router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  const isAuthed = !!me && authChecked;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {isAuthed && (
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                aria-label="Abrir menu"
                aria-controls="app-sidebar"
                aria-expanded={sidebarOpen}
                className="p-2 rounded hover:bg-slate-800 transition"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <Menu className="h-5 w-5 text-slate-300" />
              </button>
              <nav aria-label="Breadcrumb" className="text-slate-400 text-sm">
                Dashboard <span className="mx-1">/</span> Adicionar Estudante
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {me && (
                <div
                  className="flex items-center gap-2"
                  aria-label="Perfil do usuário"
                >
                  <div
                    className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center"
                    aria-hidden
                  >
                    {me.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-200 text-sm">{me.name}</span>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/login");
                }}
                aria-label="Sair"
                className="text-slate-300 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </header>
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
          <aside
            id="app-sidebar"
            aria-label="Navegação lateral"
            tabIndex={0}
            onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
            onTouchMove={(e) => {
              const x = e.touches[0]?.clientX ?? 0;
              if (touchStartX !== null && Math.abs(x - touchStartX) > 50)
                setSidebarOpen(false);
            }}
            className={`fixed md:static left-0 top-14 md:top-0 h-[calc(100vh-3.5rem)] md:h-auto w-64 transform transition-transform duration-300 ease-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } bg-slate-800 border-r border-slate-700 z-40`}
          >
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
              <Image
                src="/Logo.jpg"
                alt="Logo"
                width={36}
                height={36}
                className="rounded"
              />
              <span className="text-slate-200 font-semibold">Missão Atos</span>
            </div>
            <nav className="p-2 space-y-1">
              <Link
                href="/"
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${
                  pathname === "/"
                    ? "bg-slate-700 text-white"
                    : "text-slate-300"
                }`}
                onClick={() => setSidebarOpen(false)}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                <UserPlus className="h-4 w-4" />
                <span>Adicionar Estudante</span>
              </Link>
              {me?.role === "admin" && (
                <Link
                  href="/register"
                  className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${
                    pathname === "/register"
                      ? "bg-slate-700 text-white"
                      : "text-slate-300"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={pathname === "/register" ? "page" : undefined}
                >
                  <UserCog className="h-4 w-4" />
                  <span>Cadastrar Usuários</span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${
                  pathname === "/dashboard"
                    ? "bg-slate-700 text-white"
                    : "text-slate-300"
                }`}
                onClick={() => setSidebarOpen(false)}
                aria-current={pathname === "/dashboard" ? "page" : undefined}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </nav>
          </aside>
        )}

        <main
          className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 ${
            isAuthed && sidebarOpen ? "md:pl-64" : ""
          }`}
        >
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex flex-col items-center justify-center mb-4">
                <Image
                  src="/Logo.jpg"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="rounded-full w-1/2 mr-3 mt-10 mb-10"
                />
                <div className="flex items-center">
                  <Music className="h-10 w-10 text-blue-400 mr-3" />
                  <h1 className="text-4xl font-bold text-white">
                    Registro de Aluno
                  </h1>
                </div>
              </div>
              <p className="text-slate-400 text-lg">
                Preencha o formulário abaixo para se inscrever na escola de
                música
              </p>
            </div>

            <Card className="bg-slate-800 border-slate-700 shadow-2xl">
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Full Name */}
                <div>
                  <Label
                    htmlFor="fullName"
                    className="text-slate-200 text-sm font-medium"
                  >
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="João Silva"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label
                    htmlFor="email"
                    className="text-slate-200 text-sm font-medium"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label
                    htmlFor="phone"
                    className="text-slate-200 text-sm font-medium"
                  >
                    WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(17) 992560 - 8100"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
                    maxLength={17}
                  />
                </div>

                {/* Address */}
                <div>
                  <Label
                    htmlFor="address"
                    className="text-slate-200 text-sm font-medium"
                  >
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    placeholder="Rua Principal, 123"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
                  />
                </div>

                {/* Instruments */}
                <div>
                  <Label className="text-slate-200 text-sm font-medium">
                    Instrumentos
                  </Label>
                  <MultiSelect
                    options={INSTRUMENTS}
                    selected={formData.instruments}
                    onChange={handleInstrumentsChange}
                  />
                </div>

                {/* Availability */}
                <div className="flex items-center space-x-3 pt-2">
                  <Checkbox
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        available: checked as boolean,
                      })
                    }
                    className="border-slate-600 bg-slate-700"
                  />
                  <Label
                    htmlFor="available"
                    className="text-slate-300 font-normal cursor-pointer"
                  >
                    Disponível para aulas
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  {loading ? "Registrando..." : "Registrar Estudante"}
                </Button>
              </form>
            </Card>
            <p className="text-center text-slate-400 p-5 text-sm mt-6">
              Os dados serão enviados com segurança para o nosso banco de dados.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
