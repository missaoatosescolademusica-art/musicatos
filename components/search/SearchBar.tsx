"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useStudents } from "@/app/dashboard/contexts/students-context"

export type SearchBarProps = {
  /** Placeholder exibido no campo de busca */
  placeholder?: string
  /** Tempo de debounce em ms antes de disparar a busca */
  debounceMs?: number
  /** Classes adicionais para o container externo */
  containerClassName?: string
  /** Classes adicionais para o input */
  inputClassName?: string
  /** Classes adicionais para o botão */
  buttonClassName?: string
  /** Exibe/oculta botão de atualização manual */
  showUpdateButton?: boolean
}

/**
 * Componente de busca reutilizável com debounce e integração ao StudentsContext.
 *
 * - Contém input controlado com debounce para otimizar requisições
 * - Integra com o StudentsContext para atualizar `searchQuery`, `currentPage` e acionar `fetchStudents`
 * - Exibe botão de atualização manual e desabilita durante carregamento
 */
export default function SearchBar({
  placeholder = "Buscar...",
  debounceMs = 300,
  containerClassName = "bg-slate-800 border-slate-700 mb-6 p-4",
  inputClassName = "pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500",
  buttonClassName = "bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap",
  showUpdateButton = true,
}: SearchBarProps) {
  const {
    searchQuery,
    setSearchQuery,
    setCurrentPage,
    fetchStudents,
    loading,
  } = useStudents()

  const [value, setValue] = useState(searchQuery)

  useEffect(() => {
    setValue(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchQuery(value)
      setCurrentPage(1)
      // fetch dispara automaticamente via StudentsProvider quando searchQuery muda
    }, debounceMs)
    return () => clearTimeout(id)
  }, [value, debounceMs, setSearchQuery, setCurrentPage])

  return (
    <Card className={containerClassName}>
      <div className="flex gap-4 items-center flex-nowrap">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClassName}
          />
        </div>
        {showUpdateButton && (
          <Button
            onClick={() => fetchStudents()}
            className={buttonClassName}
            disabled={loading}
          >
            {loading ? "Buscando..." : "Atualizar"}
          </Button>
        )}
      </div>
    </Card>
  )
}

