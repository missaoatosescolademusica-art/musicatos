"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const INSTRUMENTS = ["Violão", "Canto", "Teclado", "Bateria"]

interface Student {
  id: string;
  fullName: string;
  nameFather: string;
  nameMother: string;
  phone: string;
  address: string;
  instruments: string[];
  available: boolean;
  createdAt: string;
}

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  mode: "view" | "edit";
  onSave: (student: Omit<Student, "id" | "createdAt">) => Promise<void>;
}

export function StudentDialog({
  open,
  onOpenChange,
  student,
  mode,
  onSave,
}: StudentDialogProps) {
  const [formData, setFormData] = useState<Omit<Student, "id" | "createdAt">>({
    fullName: "",
    nameFather: "",
    nameMother: "",
    phone: "",
    address: "",
    instruments: [],
    available: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        fullName: student.fullName,
        nameFather: student.nameFather,
        nameMother: student.nameMother,
        phone: student.phone,
        address: student.address,
        instruments: student.instruments,
        available: student.available,
      });
    }
  }, [student, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

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
        7
      )}`;
    }

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)} - ${cleaned.slice(
      7,
      12
    )}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mode === "view" ? "Detalhes do Estudante" : "Editar Estudante"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "view"
              ? "Visualize as informações do estudante"
              : "Edite as informações do estudante"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <Label className="text-slate-200 text-sm font-medium">
              Nome Completo
            </Label>
            <Input
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              disabled={mode === "view"}
              className="mt-1 bg-slate-700 border-slate-600 text-white disabled:opacity-60"
            />
          </div>

          {/* Name Father */}
          <div>
            <Label className="text-slate-200 text-sm font-medium">
              Nome do Pai
            </Label>
            <Input
              value={formData.nameFather}
              onChange={(e) =>
                setFormData({ ...formData, nameFather: e.target.value })
              }
              disabled={mode === "view"}
              className="mt-1 bg-slate-700 border-slate-600 text-white disabled:opacity-60"
            />
          </div>

          {/* Name Mother */}
          <div>
            <Label className="text-slate-200 text-sm font-medium">
              Nome da Mãe
            </Label>
            <Input
              value={formData.nameMother}
              onChange={(e) =>
                setFormData({ ...formData, nameMother: e.target.value })
              }
              disabled={mode === "view"}
              className="mt-1 bg-slate-700 border-slate-600 text-white disabled:opacity-60"
            />
          </div>

          {/* Phone */}
          <div>
            <Label className="text-slate-200 text-sm font-medium">
              WhatsApp
            </Label>
            <Input
              value={formData.phone}
              onChange={handlePhoneChange}
              disabled={mode === "view"}
              className="mt-1 bg-slate-700 border-slate-600 text-white disabled:opacity-60"
              maxLength={17}
            />
          </div>

          {/* Address */}
          <div>
            <Label className="text-slate-200 text-sm font-medium">
              Endereço
            </Label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              disabled={mode === "view"}
              className="mt-1 bg-slate-700 border-slate-600 text-white disabled:opacity-60"
            />
          </div>

          {/* Instruments */}
          <div>
            <Label className="text-slate-200 text-sm font-medium">
              Instrumentos
            </Label>
            {mode === "view" ? (
              <div className="mt-1 flex gap-2 flex-wrap">
                {formData.instruments.map((instrument) => (
                  <span
                    key={instrument}
                    className="inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded"
                  >
                    {instrument}
                  </span>
                ))}
              </div>
            ) : (
              <select
                value={formData.instruments[0] ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    instruments: e.target.value ? [e.target.value] : [],
                  })
                }
                className="bg-slate-700 border border-slate-600 text-white mt-1 rounded p-2 w-full"
              >
                <option value="">Selecione um instrumento</option>
                {INSTRUMENTS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center space-x-3 pt-2">
            <Checkbox
              checked={formData.available}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, available: checked as boolean })
              }
              disabled={mode === "view"}
              className="border-slate-600 bg-slate-700 disabled:opacity-60"
            />
            <Label className="text-slate-300 font-normal cursor-pointer">
              Disponível para aulas
            </Label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
          >
            {mode === "view" ? "Fechar" : "Cancelar"}
          </Button>
          {mode === "edit" && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
