"use client"
import { AuthContextState, AuthUser } from "@/app/types/contexts"
import { createContext, useContext, useEffect, useMemo, useState } from "react"



const AuthContext = createContext<AuthContextState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json()
          setMe({ name: data.name, role: data.role })
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

  const value = useMemo(() => ({ me, setMe, authChecked, setAuthChecked }), [me, authChecked])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}

