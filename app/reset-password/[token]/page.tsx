"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? match[2] : undefined
}

export default function ResetPasswordTokenPage() {
  const params = useParams() as { token?: string }
  const token = String(params?.token || "")
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [valid, setValid] = useState<boolean | null>(null)
  const [remainingMs, setRemainingMs] = useState<number>(0)
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch("/api/auth/csrf").catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(`/api/auth/password/email/validate?token=${encodeURIComponent(token)}`)
        const json = await res.json().catch(() => ({}))
        if (!cancelled) { setValid(Boolean(json.valid)); setRemainingMs(Number(json.remainingMs || 0)) }
      } catch {
        if (!cancelled) setValid(false)
      }
    }
    if (token) run()
    return () => { cancelled = true }
  }, [token])

  const strength = useMemo(() => {
    const p = password
    const length = p.length >= 8
    const upper = /[A-Z]/.test(p)
    const lower = /[a-z]/.test(p)
    const number = /[0-9]/.test(p)
    const special = /[^A-Za-z0-9]/.test(p)
    const score = [length, upper, lower, number, special].filter(Boolean).length
    return { length, upper, lower, number, special, score }
  }, [password])

  const canSubmit = useMemo(() => {
    return strength.score === 5 && password === confirm && !!token && valid === true
  }, [strength, password, confirm, token, valid])

  const submit = async () => {
    setError("")
    setSuccess(false)
    if (!canSubmit) return
    setLoading(true)
    try {
      const csrf = getCookie("csrfToken") || ""
      const res = await fetch("/api/auth/password/email/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ token, password, confirm }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String(json.message || "Erro ao redefinir senha"))
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 1500)
      }
    } catch (e: any) {
      setError(String(e?.message || "Erro"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-200">Redefinir senha</h1>
        {valid === null && (<p className="text-slate-400">Validando link...</p>)}
        {valid === false && (
          <div role="alert" className="text-red-400" aria-live="polite">Link inválido ou expirado.</div>
        )}
        {valid && (
          <>
            {remainingMs > 0 && (
              <div className="text-xs text-slate-400">Este link expira em aproximadamente {Math.ceil(remainingMs/ (60*1000))} minutos.</div>
            )}
            <div>
              <Label className="text-slate-300" htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="bg-slate-700 border-slate-600 text-white mt-1" aria-label="Nova senha" />
            </div>
            <div className="text-xs text-slate-400 grid gap-1">
              <span>Requisitos de senha:</span>
              <span className={strength.length?"text-green-400":""}>• Pelo menos 8 caracteres</span>
              <span className={strength.upper?"text-green-400":""}>• Letra maiúscula</span>
              <span className={strength.lower?"text-green-400":""}>• Letra minúscula</span>
              <span className={strength.number?"text-green-400":""}>• Número</span>
              <span className={strength.special?"text-green-400":""}>• Símbolo</span>
            </div>
            <div>
              <Label className="text-slate-300" htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="bg-slate-700 border-slate-600 text-white mt-1" aria-label="Confirmar senha" />
            </div>
            <Button onClick={submit} disabled={loading || !canSubmit} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </Button>
            {error && (<div role="alert" className="text-red-400" aria-live="polite">{error}</div>)}
            {success && (<div role="status" className="text-green-400" aria-live="polite">Senha alterada com sucesso. Redirecionando...</div>)}
          </>
        )}
      </div>
    </div>
  )
}
