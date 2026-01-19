import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/students/import/route";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";
import { NextRequest } from "next/server";

// Mock do Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    student: {
      create: vi.fn(),
    },
  },
}));

describe("POST /api/students/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import students from valid excel file", async () => {
    // Criar um Excel em memória
    const ws = XLSX.utils.json_to_sheet([
      {
        "Nome Completo": "Teste Aluno 1",
        "Telefone": "123456789",
        "Endereço": "Rua Teste 1",
        "Instrumentos": "Piano, Voz",
        "Disponível": "Sim"
      },
      {
        "Nome Completo": "Teste Aluno 2",
        "Telefone": "987654321",
        "Endereço": "Rua Teste 2",
        "Instrumentos": "Bateria",
        "Disponível": "Não"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Criar FormData mockado
    const formData = new FormData();
    // Em ambiente Node/Vitest, Blob pode precisar de buffer, e File não existe nativamente no Node < 20 globalmente as vezes
    // Vamos usar Blob que geralmente é suportado no ambiente de teste moderno
    formData.append("file", new Blob([buffer]), "students.xlsx");

    const req = new NextRequest("http://localhost/api/students/import", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.successCount).toBe(2);
    expect(json.errorCount).toBe(0);
    expect(prisma.student.create).toHaveBeenCalledTimes(2);
    
    // Verificar primeira chamada
    expect(prisma.student.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fullName: "Teste Aluno 1",
        instruments: ["Piano", "Voz"],
        available: true
      })
    });
  });

  it("should handle invalid rows gracefully", async () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Nome Completo": "Valido",
        "Telefone": "111",
        "Endereço": "End",
      },
      {
        "Nome Completo": "", // Inválido (sem nome)
        "Telefone": "222",
        "Endereço": "End",
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const formData = new FormData();
    formData.append("file", new Blob([buffer]), "students.xlsx");

    const req = new NextRequest("http://localhost/api/students/import", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.successCount).toBe(1);
    expect(json.errorCount).toBe(1);
  });
});
