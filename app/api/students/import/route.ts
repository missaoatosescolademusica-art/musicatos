import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";
import { z } from "zod";

const studentImportSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  nameFather: z.string().optional().nullable(),
  nameMother: z.string().optional().nullable(),
  phone: z.union([z.string(), z.number()]).transform((v) => String(v)),
  age: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) => (v ? Number(v) : null)),
  address: z.string().min(1, "Endereço é obrigatório"),
  instruments: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string")
        return v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return [];
    }),
  available: z.any().transform((v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const lower = v.toLowerCase();
      return lower === "sim" || lower === "yes" || lower === "true";
    }
    return true; // Default
  }),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "Arquivo vazio ou inválido" },
        { status: 400 },
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const [index, row] of jsonData.entries()) {
      try {
        // Mapeamento manual das colunas do Excel para o objeto esperado
        // As chaves do 'row' dependem do cabeçalho do Excel
        const mappedRow: any = {};

        // Função auxiliar para buscar valor case-insensitive nas chaves
        const getValue = (keys: string[]) => {
          for (const key of Object.keys(row as object)) {
            if (keys.some((k) => k.toLowerCase() === key.toLowerCase())) {
              return (row as any)[key];
            }
          }
          return undefined;
        };

        mappedRow.fullName = getValue([
          "Nome",
          "Nome Completo",
          "FullName",
          "Aluno",
        ]);
        mappedRow.nameFather = getValue(["Pai", "Nome Pai", "Father"]);
        mappedRow.nameMother = getValue(["Mãe", "Mae", "Nome Mãe", "Mother"]);
        mappedRow.phone = getValue([
          "Telefone",
          "Celular",
          "Phone",
          "Whatsapp",
        ]);
        mappedRow.age = getValue(["Idade", "Age"]);
        mappedRow.address = getValue(["Endereço", "Endereco", "Address"]);
        mappedRow.instruments = getValue([
          "Instrumentos",
          "Instruments",
          "Curso",
        ]);
        mappedRow.available = getValue([
          "Disponível",
          "Disponivel",
          "Available",
          "Ativo",
        ]);

        // Se campos obrigatórios estiverem faltando no mapeamento, tenta pegar pelo nome da propriedade direto se o excel já estiver formatado
        if (!mappedRow.fullName && (row as any).fullName)
          mappedRow.fullName = (row as any).fullName;
        if (!mappedRow.phone && (row as any).phone)
          mappedRow.phone = (row as any).phone;
        if (!mappedRow.address && (row as any).address)
          mappedRow.address = (row as any).address;

        const parsedData = studentImportSchema.parse(mappedRow);

        await prisma.student.create({
          data: {
            fullName: parsedData.fullName,
            nameFather: parsedData.nameFather,
            nameMother: parsedData.nameMother,
            phone: parsedData.phone,
            age: parsedData.age,
            address: parsedData.address,
            instruments: parsedData.instruments,
            available: parsedData.available,
          },
        });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push({
          row: index + 2,
          error: (err as Error).message,
          data: row,
        });
      }
    }

    return NextResponse.json({
      message: "Importação concluída",
      successCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
