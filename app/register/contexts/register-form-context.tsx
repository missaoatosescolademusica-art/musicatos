"use client"
import { createContext, useContext, useMemo, useState } from "react"

export type RegisterFormContextState = {
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  show1: boolean
  setShow1: (v: boolean) => void
  show2: boolean
  setShow2: (v: boolean) => void
  role: string
  setRole: (v: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
}

const RegisterFormContext = createContext<RegisterFormContextState | undefined>(undefined)

export function RegisterFormProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [role, setRole] = useState("user")
  const [loading, setLoading] = useState(false)

  const value = useMemo(
    () => ({
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
    }),
    [name, email, password, confirmPassword, show1, show2, role, loading]
  )

  return (
    <RegisterFormContext.Provider value={value}>{children}</RegisterFormContext.Provider>
  )
}

export function useRegisterForm() {
  const ctx = useContext(RegisterFormContext)
  if (!ctx) throw new Error("useRegisterForm deve ser usado dentro de RegisterFormProvider")
  return ctx
}

