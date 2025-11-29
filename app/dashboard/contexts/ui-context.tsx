"use client"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type UIContextState = {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  touchStartX: number | null
  setTouchStartX: (v: number | null) => void
}

const UIContext = createContext<UIContextState | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarOpen")
      if (saved !== null) setSidebarOpen(saved === "true")
    } catch {}
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    try { localStorage.setItem("sidebarOpen", String(sidebarOpen)) } catch {}
  }, [sidebarOpen])

  const value = useMemo(() => ({ sidebarOpen, setSidebarOpen, touchStartX, setTouchStartX }), [sidebarOpen, touchStartX])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error("useUI deve ser usado dentro de UIProvider")
  return ctx
}

