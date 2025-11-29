"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/auth/csrf").catch(() => {})
  }, [])

  const submit = async () => {
    setLoading(true)
    try {
      const csrf = getCookie("csrfToken")
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf || "" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Login realizado", { description: data.token })
      } else {
        toast.error(data.message || "Credenciais inválidas")
      }
    } catch {
      toast.error("Erro de servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <Image src="/logo.jpg" alt="Logo" width={128} height={128} className="mx-auto rounded-full" />
        <div className="flex items-center gap-2 mb-2">
          <LogIn className="h-6 w-6 text-blue-400" />
          <h1 className="text-xl font-semibold pb-2">Entrar</h1>
        </div>
        <div>
          <Label className="text-slate-300">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-slate-300">Senha</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white mt-1 pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-2.5 text-slate-300"
            >
              {show ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <Button
          onClick={submit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Carregando..." : "Entrar"}
        </Button>
        <div className="mt-4 text-sm text-slate-400">
          <span>Não tem uma conta? </span>
          <a href="/register" className="text-blue-400 hover:underline">
            Registrar-se
          </a>
        </div>
      </div>
    </div>
  );
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? match[2] : undefined
}
