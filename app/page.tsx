"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/multi-select"
import { toast } from "sonner"
import { Music } from "lucide-react"

const INSTRUMENTS = ["Violão", "Canto", "Teclado", "Bateria"]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    instruments: [] as string[],
    available: true,
  })

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length <= 2) {
      return cleaned
    }

    if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    }

    if (cleaned.length <= 12) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} - ${cleaned.slice(7)}`
    }

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} - ${cleaned.slice(7, 12)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleInstrumentsChange = (selected: string[]) => {
    setFormData({ ...formData, instruments: selected })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (formData.instruments.length === 0) {
      toast.error("Selecione pelo menos um instrumento")
      return
    }

    setLoading(true)
    try {
      console.log(formData)
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        console.log(response)
        const error = await response.json()
        throw new Error(error.message || "Erro ao registrar estudante")
      }

      toast.success("Estudante registrado com sucesso!")
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        instruments: [],
        available: true,
      })
      // router.push('/dashboard')
    } catch (error) {
      console.log(error)
      toast.error(error instanceof Error ? error.message : "Erro ao registrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Music className="h-10 w-10 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Registro de Estudante</h1>
          </div>
          <p className="text-slate-400 text-lg">Preencha o formulário abaixo para registrar um novo estudante</p>
        </div>

        {/* Form Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" className="text-slate-200 text-sm font-medium">
                Nome Completo
              </Label>
              <Input
                id="fullName"
                placeholder="João Silva"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-slate-200 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-slate-200 text-sm font-medium">
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
              <Label htmlFor="address" className="text-slate-200 text-sm font-medium">
                Endereço
              </Label>
              <Input
                id="address"
                placeholder="Rua Principal, 123"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            {/* Instruments */}
            <div>
              <Label className="text-slate-200 text-sm font-medium">Instrumentos</Label>
              <MultiSelect options={INSTRUMENTS} selected={formData.instruments} onChange={handleInstrumentsChange} />
            </div>

            {/* Availability */}
            <div className="flex items-center space-x-3 pt-2">
              <Checkbox
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked as boolean })}
                className="border-slate-600 bg-slate-700"
              />
              <Label htmlFor="available" className="text-slate-300 font-normal cursor-pointer">
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

        {/* Info Text */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Os dados serão enviados com segurança para o nosso banco de dados.
        </p>
      </div>
    </div>
  )
}
