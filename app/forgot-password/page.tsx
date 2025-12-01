"use client"
import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1|2|3>(1)
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [token, setToken] = useState("")
  const [locale, setLocale] = useState("pt")
  const router = useRouter()

  const sendCode = async () => {
    const csrf = document.cookie.split(";").find((c) => c.trim().startsWith("csrfToken="))?.split("=")[1] || ""
    const res = await fetch("/api/auth/password/request", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ emailOrPhone, locale }) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) alert(json.message || "Erro")
    else setStep(2)
  }
  const verifyCode = async () => {
    const csrf = document.cookie.split(";").find((c) => c.trim().startsWith("csrfToken="))?.split("=")[1] || ""
    const res = await fetch("/api/auth/password/verify", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ emailOrPhone, code }) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) alert(json.message || "Erro")
    else { setToken(String(json.token||"")); setStep(3) }
  }
  const resetPassword = async () => {
    const csrf = document.cookie.split(";").find((c) => c.trim().startsWith("csrfToken="))?.split("=")[1] || ""
    const res = await fetch("/api/auth/password/reset", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ token, newPassword }) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) alert(json.message || "Erro")
    else router.replace("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded p-6">
        <h1 className="text-xl font-semibold text-slate-200">Esqueci minha senha</h1>
        <div className="mt-4 flex gap-2">
          <select value={locale} onChange={(e)=>setLocale(e.target.value)} className="bg-slate-700 border-slate-600 text-white rounded p-2">
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
        </div>
        {step===1 && (
          <div className="mt-4 grid gap-3">
            <Input value={emailOrPhone} onChange={(e)=>setEmailOrPhone(e.target.value)} placeholder="Email ou telefone (+5511999999999)" className="bg-slate-700 border-slate-600 text-white" aria-label="Email ou telefone" />
            <Button onClick={sendCode} className="bg-blue-600 hover:bg-blue-700">Enviar código de verificação</Button>
          </div>
        )}
        {step===2 && (
          <div className="mt-4 grid gap-3">
            <Input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Código de 6 dígitos" className="bg-slate-700 border-slate-600 text-white" aria-label="Código de verificação" />
            <Button onClick={verifyCode} className="bg-blue-600 hover:bg-blue-700">Validar código</Button>
          </div>
        )}
        {step===3 && (
          <div className="mt-4 grid gap-3">
            <Input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Nova senha" className="bg-slate-700 border-slate-600 text-white" aria-label="Nova senha" />
            <Button onClick={resetPassword} className="bg-blue-600 hover:bg-blue-700">Redefinir senha</Button>
          </div>
        )}
      </div>
    </div>
  )
}
