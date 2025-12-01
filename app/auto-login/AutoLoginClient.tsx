"use client"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AutoLoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  useEffect(() => {
    const token = params.get("token") || ""
    if (!token) {
      router.replace("/login")
      return
    }
    try {
      sessionStorage.setItem("auth_bearer", token)
      const originalFetch = window.fetch
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const t = sessionStorage.getItem("auth_bearer")
        const headers = new Headers(init?.headers || {})
        if (t && !headers.get("authorization")) headers.set("authorization", `Bearer ${t}`)
        return originalFetch(input as any, { ...(init || {}), headers })
      }
    } catch {}
    router.replace("/dashboard")
  }, [params])
  return null
}
