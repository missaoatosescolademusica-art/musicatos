"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Image from "next/image";
import { logout as logoutHandle } from "./helper/handles";
import { StudentsProvider, useStudents } from "./contexts/students-context";
import { UIProvider, useUI } from "./contexts/ui-context";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { StatusProvider } from "./contexts/status-context";

import { StudentDialog } from "@/components/student-dialog";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import SearchBar from "@/components/search/SearchBar";
import DataTable from "@/components/shared/DataTable";
import { ActionsDataTable } from "@/components/shared/ActionsDataTable";
import { Student } from "../types/students";
import FloatingAttendanceFAB from "@/components/attendance/FloatingAttendanceFAB";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

export default function DashboardPage() {
  return (
    <AuthProvider>
      <UIProvider>
        <StatusProvider>
          <StudentsProvider>
            <DashboardContent />
          </StudentsProvider>
        </StatusProvider>
      </UIProvider>
    </AuthProvider>
  );
}

function DashboardContent() {
  const {
    students,
    loading,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedStudent,
    dialogOpen,
    setDialogOpen,
    dialogMode,
    fetchStudents,
    viewStudent,
    editStudent,
    deleteStudent,
    saveStudent,
  } = useStudents();
  const { sidebarOpen, setSidebarOpen, touchStartX, setTouchStartX } = useUI();
  const { me } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchQuery]);

  const isAdmin = me?.role === "admin";
  const isProfessor = me?.role === "professor";
  const [instrumentFilter, setInstrumentFilter] = React.useState("");
  const [availableFilter, setAvailableFilter] = React.useState("");

  const logout = async () => logoutHandle((path) => router.push(path));

  return (
    <div className="min-h-screen bg-linear-to-br pb-10 from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white">
      <Topbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        me={{
          name: me?.name ?? "",
          avatarUrl: me?.avatarUrl ?? "",
          role: me?.role ?? "",
        }}
        onLogout={logout}
        breadcrumb={"Dashboard / Estudantes"}
      />

      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
          onTouchMove={(e) => {
            const x = e.touches[0]?.clientX ?? 0;
            if (touchStartX !== null && Math.abs(x - touchStartX) > 50)
              setSidebarOpen(false);
          }}
          className="fixed inset-0 top-14 md:hidden bg-black/50 z-30 transition-opacity duration-300"
        />
      )}

      <div className="flex">
        <Sidebar
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
          pathname={pathname}
          role={me?.role ?? ""}
          touchStartX={touchStartX}
          setTouchStartX={setTouchStartX}
        />

        {/* Main Content */}
        <main
          className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 ${
            sidebarOpen ? "md:pl-64" : ""
          }`}
        >
          <div className="w-full max-w-[90vw] sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col items-center mb-2">
                <Image
                  src="/Logo.jpg"
                  alt="Logo"
                  width={200}
                  height={100}
                  className="rounded-full mr-3 mb-10"
                />
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-400 mr-3" />
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {isProfessor
                      ? "Painel do Professor"
                      : "Painel Administrativo"}
                  </h1>
                </div>
              </div>
              <p className="text-slate-800 dark:text-slate-400 text-center">
                Gerencie todos os alunos registrados
              </p>
            </div>

            <SearchBar placeholder="Buscar por ID do estudante..." />

            {isProfessor && (
              <div className="bg-slate-800 border border-slate-700 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-slate-300">Instrumento</Label>
                  <Input
                    value={instrumentFilter}
                    onChange={(e) => setInstrumentFilter(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="Ex.: Violão"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Disponibilidade</Label>
                  <select
                    value={availableFilter}
                    onChange={(e) => setAvailableFilter(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white mt-1 rounded p-2 w-full"
                  >
                    <option value="">Todos</option>
                    <option value="true">Disponível</option>
                    <option value="false">Indisponível</option>
                  </select>
                </div>
              </div>
            )}
            <DataTable
              data={
                isProfessor
                  ? students.filter((s) => {
                      const iok = instrumentFilter
                        ? s.instruments.some((i) =>
                            i
                              .toLowerCase()
                              .includes(instrumentFilter.toLowerCase())
                          )
                        : true;
                      const aok = availableFilter
                        ? String(s.available) === availableFilter
                        : true;
                      return iok && aok;
                    })
                  : students
              }
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={10}
              onPageChange={(p) => setCurrentPage(p)}
              containerClassName="bg-slate-800 border-slate-700 overflow-hidden shadow-xl"
              headerRowClassName="bg-slate-700"
              bodyRowClassName="border-slate-700 hover:bg-slate-700 transition"
              columns={[
                {
                  header: "ID",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  cellClassName: "text-slate-300 font-mono text-sm",
                  render: (s: Student) => `${s.id.slice(0, 8)}...`,
                },
                {
                  header: "Nome",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  cellClassName: "text-white font-medium",
                  render: (s: Student) => s.fullName,
                },
                {
                  header: "Pai",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  cellClassName: "text-slate-300",
                  render: (s: Student) => s.nameFather,
                },
                {
                  header: "Mãe",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  cellClassName: "text-slate-300",
                  render: (s: Student) => s.nameMother,
                },
                {
                  header: "WhatsApp",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  cellClassName: "text-slate-300",
                  render: (s: Student) => s.phone,
                },
                {
                  header: "Instrumentos",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  render: (s: Student) => (
                    <div className="flex gap-1 flex-wrap">
                      {s.instruments.map((instrument) => (
                        <Badge
                          key={instrument}
                          variant="secondary"
                          className="bg-blue-600 text-white"
                        >
                          {instrument}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
                {
                  header: "Disponível",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  render: (s: Student) => (
                    <Badge
                      className={
                        s.available
                          ? "bg-green-600 text-white"
                          : "bg-slate-600 text-slate-300"
                      }
                    >
                      {s.available ? "Sim" : "Não"}
                    </Badge>
                  ),
                },
                {
                  header: "Ações",
                  headerClassName:
                    "text-slate-900 dark:text-slate-300 font-semibold",
                  render: (s: Student) => (
                    <ActionsDataTable
                      viewStudent={() => viewStudent(s)}
                      editStudent={() => editStudent(s)}
                      deleteStudent={() => deleteStudent(s.id)}
                      canDelete={isAdmin}
                      s={s}
                    />
                  ),
                },
              ]}
            />
          </div>

          {/* Student Dialog */}
          <StudentDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            student={selectedStudent}
            mode={dialogMode}
            onSave={(data) => saveStudent(data)}
          />
        </main>
      </div>
      <FloatingAttendanceFAB />
    </div>
  );
}
