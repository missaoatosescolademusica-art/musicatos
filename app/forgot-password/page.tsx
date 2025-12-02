"use client"
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateEmail } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("pt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/csrf").catch(() => {});
  }, []);

  const submit = async () => {
    setError("");
    setSuccess(false);
    if (!validateEmail(email)) {
      setError("Email inválido");
      return;
    }
    setLoading(true);
    try {
      const csrf =
        document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("csrfToken="))
          ?.split("=")[1] || "";
      const res = await fetch("/api/auth/password/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ email, locale }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.message || "Erro");
      else setSuccess(true);
    } catch (e: any) {
      setError(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded p-6">
        <h1 className="text-xl font-semibold text-slate-200">
          Esqueci minha senha
        </h1>
        <p className="text-slate-400">
          Informe seu email para receber o link de redefinição.
        </p>
        <div className="mt-4 grid gap-3">
          <label className="text-slate-300" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="bg-slate-700 border-slate-600 text-white"
            aria-label="Email"
          />
          <div className="flex items-center gap-2">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white rounded p-2"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
            <Button
              onClick={submit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
          </div>
          {error && (
            <div role="alert" className="text-red-400" aria-live="polite">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="text-green-400" aria-live="polite">
              Verifique seu email e siga o link enviado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
