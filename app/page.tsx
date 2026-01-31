"use client";
import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Music } from "lucide-react";
import Image from "next/image";

import { AuthProvider, useAuth } from "@/app/dashboard/contexts/auth-context";
import { StatusProvider } from "@/app/dashboard/contexts/status-context";

const INSTRUMENTS = ["Violão", "Canto", "Teclado", "Bateria"];

function HomeContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { me, authChecked } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    nameFather: "",
    nameMother: "",
    phone: "",
    address: "",
    instruments: [] as string[],
    available: true,
  });

  // Auth é carregado pelo AuthProvider

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarOpen");
      if (saved !== null) setSidebarOpen(saved === "true");
    } catch {}
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", String(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) {
      return cleaned;
    }

    if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }

    if (cleaned.length <= 12) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} - ${cleaned.slice(
        7,
      )}`;
    }

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} - ${cleaned.slice(
      7,
      12,
    )}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const ageNumber = Number(formData.age);
  const isMinor = !Number.isNaN(ageNumber) && ageNumber > 0 && ageNumber < 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAge = Number(formData.age);
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.address ||
      !formData.age ||
      Number.isNaN(parsedAge) ||
      parsedAge <= 0
    ) {
      toast.error("Informe nome, idade, telefone e endereço válidos");
      return;
    }

    if (isMinor && (!formData.nameFather || !formData.nameMother)) {
      toast.error("Para menores de 18 anos, informe o nome do pai e da mãe");
      return;
    }

    if (formData.instruments.length === 0) {
      toast.error("Selecione pelo menos um instrumento");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.info(response);
        const error = await response.json();
        throw new Error(error.message || "Erro ao registrar estudante");
      }

      toast.success("Estudante registrado com sucesso!");
      setFormData({
        fullName: "",
        age: "",
        nameFather: "",
        nameMother: "",
        phone: "",
        address: "",
        instruments: [],
        available: true,
      });
      // router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  const isAuthed = !!me && authChecked;

  return (
    <div
      className="min-h-screen relative w-full"
      style={{
        backgroundImage: "url('/fundo-da-musica-moderna.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm pointer-events-none" />
      <div className="relative z-10">
        <div className="flex">
          <main
            className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 ${
              isAuthed && sidebarOpen ? "md:pl-64" : ""
            }`}
          >
            <div className="md:w-full max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <div className="flex flex-col items-center justify-center mb-4">
                  <Image
                    src="/Logo.jpg"
                    alt="Logo"
                    width={100}
                    height={100}
                    className="rounded-full w-1/2 mr-3 mt-10 mb-10"
                  />
                  <div className="flex items-center">
                    <Music className="h-10 w-10 text-primary mr-3" />
                    <h1 className="text-4xl font-bold text-foreground">
                      Registro de Aluno
                    </h1>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg">
                  Preencha o formulário abaixo para se inscrever na escola de
                  música
                </p>
              </div>
              <Card className="bg-card border-border shadow-2xl">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div>
                    <Label
                      htmlFor="fullName"
                      className="text-foreground text-sm font-medium"
                    >
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="João Silva"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="bg-input border-input text-foreground"
                    />
                  </div>
                  <div className="mt-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400">
                    <Label
                      htmlFor="age"
                      className="text-foreground text-sm font-medium"
                    >
                      Idade
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="18"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="mt-2 bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                      min={1}
                      max={120}
                    />
                  </div>

                  {isMinor && (
                    <>
                      <div>
                        <Label
                          htmlFor="nameFather"
                          className="text-foreground text-sm font-medium"
                        >
                          Nome do pai
                        </Label>
                        <Input
                          id="nameFather"
                          placeholder="João da silva sauro"
                          value={formData.nameFather}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nameFather: e.target.value,
                            })
                          }
                          className="mt-2 bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="nameMother"
                          className="text-foreground text-sm font-medium"
                        >
                          Nome da mãe
                        </Label>
                        <Input
                          id="nameMother"
                          placeholder="Joana da silva sauro"
                          value={formData.nameMother}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nameMother: e.target.value,
                            })
                          }
                          className="mt-2 bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                        />
                      </div>
                    </>
                  )}

                  {/* Phone */}
                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-foreground text-sm font-medium"
                    >
                      WhatsApp
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000 - 0000"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="mt-2 bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                      maxLength={17}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <Label
                      htmlFor="address"
                      className="text-foreground text-sm font-medium"
                    >
                      Endereço
                    </Label>
                    <Input
                      id="address"
                      placeholder="Rua Principal, 123"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="mt-2 bg-input border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>

                  {/* Instruments */}
                  <div>
                    <Label className="text-foreground text-sm font-medium">
                      Instrumentos
                    </Label>
                    <select
                      value={formData.instruments[0] ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instruments: e.target.value ? [e.target.value] : [],
                        })
                      }
                      className="bg-input border border-input text-foreground mt-1 rounded p-2 w-full"
                    >
                      <option value="">Selecione um instrumento</option>
                      {INSTRUMENTS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center space-x-3 pt-2">
                    <Checkbox
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          available: checked as boolean,
                        })
                      }
                      className="border-input bg-input"
                    />
                    <Label
                      htmlFor="available"
                      className="text-foreground font-normal cursor-pointer"
                    >
                      Disponível para aulas
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    {loading ? "Registrando..." : "Registrar Estudante"}
                  </Button>
                </form>
              </Card>

              <p className="text-center text-muted-foreground p-5 text-sm mt-6">
                Os dados serão enviados com segurança para o nosso banco de
                dados.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <StatusProvider>
        <HomeContent />
      </StatusProvider>
    </AuthProvider>
  );
}
