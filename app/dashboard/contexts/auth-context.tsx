"use client"
import { AuthContextState, AuthUser } from "@/app/types/contexts"
import { createContext, useContext, useEffect, useMemo, useState } from "react"



const AuthContext = createContext<AuthContextState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const headers: Record<string, string> = {};
    try {
      const t = sessionStorage.getItem("auth_bearer");
      if (t) headers["authorization"] = `Bearer ${t}`;
    } catch {}
    fetch("/api/auth/me", { headers })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setMe({
            id: data.id,
            name: data.name,
            role: data.role,
            avatarUrl: data.avatarUrl,
          });
          try {
            const t = sessionStorage.getItem("auth_bearer")
            if (!t) {
              const prev = localStorage.getItem("user_id")
              if (prev && prev !== data.id) localStorage.removeItem("user_avatar")
              localStorage.setItem("user_id", data.id)
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, [])

  const value = useMemo(() => ({ me, setMe, authChecked, setAuthChecked }), [me, authChecked])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
