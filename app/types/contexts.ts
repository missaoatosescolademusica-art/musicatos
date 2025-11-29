import { Student } from "./students"

export type StudentsContextState = {
  students: Student[]
  setStudents: (s: Student[]) => void
  loading: boolean
  setLoading: (v: boolean) => void
  error: string | null
  setError: (v: string | null) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  currentPage: number
  setCurrentPage: (v: number) => void
  totalPages: number
  setTotalPages: (v: number) => void
  selectedStudent: Student | null
  setSelectedStudent: (s: Student | null) => void
  dialogOpen: boolean
  setDialogOpen: (v: boolean) => void
  dialogMode: "view" | "edit"
  setDialogMode: (m: "view" | "edit") => void
  fetchStudents: () => Promise<void> | void
  viewStudent: (student: Student) => void
  editStudent: (student: Student) => void
  deleteStudent: (id: string) => Promise<void>
  saveStudent: (data: Omit<Student, "id" | "createdAt">) => Promise<void>
}

export type AuthUser = { name: string; role: string }

export type AuthContextState = {
  me: AuthUser | null
  setMe: (u: AuthUser | null) => void
  authChecked: boolean
  setAuthChecked: (v: boolean) => void
}
