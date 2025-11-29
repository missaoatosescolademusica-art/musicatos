import { FetchStudentsDeps, Student } from "@/app/types/students"
import { toast } from "sonner"



export async function fetchStudents(deps: FetchStudentsDeps) {
  const { currentPage, searchQuery, setLoading, setStudents, setTotalPages } = deps
  setLoading(true)
  try {
    const response = await fetch(
      `/api/students?page=${currentPage}&search=${encodeURIComponent(searchQuery)}`
    )
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

export type DialogDeps = {
  setSelectedStudent: (s: Student | null) => void
  setDialogMode: (m: "view" | "edit") => void
  setDialogOpen: (v: boolean) => void
}

export function handleViewStudent(student: Student, deps: DialogDeps) {
  const { setSelectedStudent, setDialogMode, setDialogOpen } = deps
  setSelectedStudent(student)
  setDialogMode("view")
  setDialogOpen(true)
}

export function handleEditStudent(student: Student, deps: DialogDeps) {
  const { setSelectedStudent, setDialogMode, setDialogOpen } = deps
  setSelectedStudent(student)
  setDialogMode("edit")
  setDialogOpen(true)
}

export type DeleteDeps = {
  fetchStudents: () => Promise<void> | void
}

export async function handleDeleteStudent(id: string, deps: DeleteDeps) {
  if (!confirm("Tem certeza que deseja deletar este estudante?")) return

  try {
    const response = await fetch(`/api/students/${id}`, { method: "DELETE" })
    if (!response.ok) throw new Error("Failed to delete")

    toast.success("Estudante deletado com sucesso")
    await Promise.resolve(deps.fetchStudents())
  } catch (error) {
    toast.error("Erro ao deletar estudante")
  }
}

export type SaveDeps = {
  selectedStudent: Student | null
  setDialogOpen: (v: boolean) => void
  fetchStudents: () => Promise<void> | void
}

export async function handleSaveStudent(
  data: Omit<Student, "id" | "createdAt">,
  deps: SaveDeps
) {
  const { selectedStudent, setDialogOpen, fetchStudents } = deps
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
    await Promise.resolve(fetchStudents())
  } catch (error) {
    toast.error("Erro ao atualizar estudante")
  }
}

export async function logout(routerPush: (path: string) => void) {
  await fetch("/api/auth/logout", { method: "POST" })
  routerPush("/login")
}

