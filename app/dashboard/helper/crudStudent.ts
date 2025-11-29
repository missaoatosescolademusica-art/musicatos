import { FetchStudentsDeps, Student } from "@/app/types/students"
import {
  fetchStudents as fetchStudentsHandle,
  handleViewStudent as handleViewStudentHandle,
  handleEditStudent as handleEditStudentHandle,
  handleDeleteStudent as handleDeleteStudentHandle,
  handleSaveStudent as handleSaveStudentHandle,
} from "../helper/handles"

export const fetchStudents = ({
  currentPage,
  searchQuery,
  setLoading,
  setStudents,
  setTotalPages,
}: FetchStudentsDeps) =>
    fetchStudentsHandle({
      currentPage,
      searchQuery,
      setLoading,
      setStudents,
      setTotalPages,
    })

export const viewStudent = (
  student: Student,
  { setSelectedStudent, setDialogMode, setDialogOpen }: {
    setSelectedStudent: (v: Student | null) => void;
    setDialogMode: (v: "view" | "edit") => void;
    setDialogOpen: (v: boolean) => void;
  }
) =>
  handleViewStudentHandle(student, {
    setSelectedStudent,
    setDialogMode,
    setDialogOpen,
  });

export const editStudent = (
  student: Student,
  { setSelectedStudent, setDialogMode, setDialogOpen }: {
    setSelectedStudent: (v: Student | null) => void;
    setDialogMode: (v: "view" | "edit") => void;
    setDialogOpen: (v: boolean) => void;
  }
) =>
  handleEditStudentHandle(student, {
    setSelectedStudent,
    setDialogMode,
    setDialogOpen,
  })

export const deleteStudent = (
  id: string,
  { fetchStudents }: { fetchStudents: () => void }
) =>
  handleDeleteStudentHandle(id, {
    fetchStudents,
  })

export const saveStudent = (
  data: Omit<Student, "id" | "createdAt">,
  { selectedStudent, setDialogOpen, fetchStudents }: {
    selectedStudent: Student | null;
    setDialogOpen: (v: boolean) => void;
    fetchStudents: () => void;
  }
) =>
  handleSaveStudentHandle(data, {
    selectedStudent,
    setDialogOpen,
    fetchStudents,
  })
