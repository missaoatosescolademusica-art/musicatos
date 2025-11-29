"use client"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { Student } from "@/app/types/students"
import {
  fetchStudents as fetchStudentsWrapper,
  viewStudent as viewStudentWrapper,
  editStudent as editStudentWrapper,
  deleteStudent as deleteStudentWrapper,
  saveStudent as saveStudentWrapper,
} from "../helper/crudStudent";

import { StudentsContextState } from "@/app/types/contexts"



const StudentsContext = createContext<StudentsContextState | undefined>(undefined)

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    fetchStudentsWrapper({
      currentPage,
      searchQuery,
      setLoading,
      setStudents,
      setTotalPages,
    })
  }, [currentPage, searchQuery])

  const fetchStudents = () => {
    setError(null)
    return fetchStudentsWrapper({
      currentPage,
      searchQuery,
      setLoading,
      setStudents,
      setTotalPages,
    })
  }

  const viewStudent = (student: Student) =>
    viewStudentWrapper(student, { setSelectedStudent, setDialogMode, setDialogOpen })

  const editStudent = (student: Student) =>
    editStudentWrapper(student, { setSelectedStudent, setDialogMode, setDialogOpen })

  const deleteStudent = (id: string) =>
    deleteStudentWrapper(id, { fetchStudents })

  const saveStudent = (data: Omit<Student, "id" | "createdAt">) =>
    saveStudentWrapper(data, { selectedStudent, setDialogOpen, fetchStudents })

  const value = useMemo(
    () => ({
      students,
      setStudents,
      loading,
      setLoading,
      error,
      setError,
      searchQuery,
      setSearchQuery,
      currentPage,
      setCurrentPage,
      totalPages,
      setTotalPages,
      selectedStudent,
      setSelectedStudent,
      dialogOpen,
      setDialogOpen,
      dialogMode,
      setDialogMode,
      fetchStudents,
      viewStudent,
      editStudent,
      deleteStudent,
      saveStudent,
    }),
    [
      students,
      loading,
      searchQuery,
      currentPage,
      totalPages,
      selectedStudent,
      dialogOpen,
      dialogMode,
    ]
  )

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>
}

export function useStudents() {
  const ctx = useContext(StudentsContext)
  if (!ctx) throw new Error("useStudents deve ser usado dentro de StudentsProvider")
  return ctx
}
