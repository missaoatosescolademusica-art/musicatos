"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, MoreHorizontal, Eye, Edit2, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { StudentDialog } from "@/components/student-dialog"

interface Student {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  instruments: string[]
  available: boolean
  createdAt: string
}

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view")

  const itemsPerPage = 10

  useEffect(() => {
    fetchStudents()
  }, [currentPage, searchQuery])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/students?page=${currentPage}&search=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error("Failed to fetch students")

      const data = await response.json()
      setStudents(data.students)
      setTotalPages(data.totalPages)
    } catch (error) {
      toast.error("Erro ao carregar estudantes")
    } finally {
      setLoading(false)
    }
  }

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setDialogMode("view")
    setDialogOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setDialogMode("edit")
    setDialogOpen(true)
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este estudante?")) return

    try {
      const response = await fetch(`/api/students/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")

      toast.success("Estudante deletado com sucesso")
      fetchStudents()
    } catch (error) {
      toast.error("Erro ao deletar estudante")
    }
  }

  const handleSaveStudent = async (data: Omit<Student, "id" | "createdAt">) => {
    if (!selectedStudent) return

    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast.success("Estudante atualizado com sucesso")
      setDialogOpen(false)
      fetchStudents()
    } catch (error) {
      toast.error("Erro ao atualizar estudante")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Users className="h-8 w-8 text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
          </div>
          <p className="text-slate-400">Gerencie todos os estudantes registrados</p>
        </div>

        {/* Search and Controls */}
        <Card className="bg-slate-800 border-slate-700 mb-6 p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por ID do estudante..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Button onClick={() => fetchStudents()} className="bg-blue-600 hover:bg-blue-700 text-white">
              Atualizar
            </Button>
          </div>
        </Card>

        {/* Students Table */}
        <Card className="bg-slate-800 border-slate-700 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-700">
                <TableRow className="border-slate-600 hover:bg-slate-700">
                  <TableHead className="text-slate-300 font-semibold">ID</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Nome</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Email</TableHead>
                  <TableHead className="text-slate-300 font-semibold">WhatsApp</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Instrumentos</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Disponível</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      Nenhum estudante encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id} className="border-slate-700 hover:bg-slate-700 transition">
                      <TableCell className="text-slate-300 font-mono text-sm">{student.id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-white font-medium">{student.fullName}</TableCell>
                      <TableCell className="text-slate-300">{student.email}</TableCell>
                      <TableCell className="text-slate-300">{student.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {student.instruments.map((instrument) => (
                            <Badge key={instrument} variant="secondary" className="bg-blue-600 text-white">
                              {instrument}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={student.available ? "bg-green-600 text-white" : "bg-slate-600 text-slate-300"}
                        >
                          {student.available ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-700 border-slate-600">
                            <DropdownMenuItem
                              onClick={() => handleViewStudent(student)}
                              className="text-slate-200 cursor-pointer hover:bg-slate-600"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditStudent(student)}
                              className="text-slate-200 cursor-pointer hover:bg-slate-600"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-400 cursor-pointer hover:bg-slate-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="bg-slate-700 px-6 py-4 flex items-center justify-between border-t border-slate-600">
            <p className="text-slate-400 text-sm">
              Página {currentPage} de {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-slate-600 border-slate-500 text-slate-200 hover:bg-slate-500"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="bg-slate-600 border-slate-500 text-slate-200 hover:bg-slate-500"
              >
                Próxima
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Student Dialog */}
      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
        mode={dialogMode}
        onSave={handleSaveStudent}
      />
    </div>
  )
}
