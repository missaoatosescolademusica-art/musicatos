"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportStudentsButtonProps {
  onSuccess?: () => void;
}

export function ImportStudentsButton({ onSuccess }: ImportStudentsButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao importar");
      }

      if (data.errorCount > 0) {
        toast.warning(`Importado com avisos: ${data.successCount} sucessos, ${data.errorCount} falhas. Verifique o console para detalhes.`);
        console.warn("Erros de importação:", data.errors);
      } else {
        toast.success(`Importação concluída! ${data.successCount} estudantes adicionados.`);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadTemplate = () => {
    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet([
        {
          "Nome Completo": "João da Silva",
          "Pai": "José da Silva",
          "Mãe": "Maria da Silva",
          "Telefone": "11988887777",
          "Idade": 12,
          "Endereço": "Rua das Flores, 123 - Centro",
          "Instrumentos": "Violão, Teclado",
          "Disponível": "Sim"
        }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Modelo");
      XLSX.writeFile(wb, "modelo_importacao_alunos.xlsx");
    });
  };

  return (
    <div className="flex gap-2">
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <Button 
        variant="outline" 
        onClick={() => handleDownloadTemplate()}
        title="Baixar Modelo de Planilha"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Baixar Modelo
      </Button>

      <Button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isUploading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        Importar Alunos
      </Button>
    </div>
  );
}
