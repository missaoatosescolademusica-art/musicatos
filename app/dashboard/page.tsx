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

import { StudentDialog } from "@/components/student-dialog";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import SearchBar from "@/components/search/SearchBar";
import DataTable from "@/components/shared/DataTable";
import { ActionsDataTable } from "@/components/shared/ActionsDataTable";
import { Student } from "../types/students";

export default function DashboardPage() {
  return (
    <AuthProvider>
      <UIProvider>
        <StudentsProvider>
          <DashboardContent />
        </StudentsProvider>
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

  const logout = async () => logoutHandle((path) => router.push(path));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Topbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        me={me}
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
          isAdmin={isAdmin}
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
                  <h1 className="text-3xl font-bold text-white">
                    Painel Administrativo
                  </h1>
                </div>
              </div>
              <p className="text-slate-400 text-center">
                Gerencie todos os alunos registrados
              </p>
            </div>

            <SearchBar placeholder="Buscar por ID do estudante..." />

            <DataTable
              data={students}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={10}
              onPageChange={(p) => setCurrentPage(p)}
              columns={[
                {
                  header: "ID",
                  cellClassName: "text-slate-300 font-mono text-sm",
                  render: (s: Student) => `${s.id.slice(0, 8)}...`,
                },
                {
                  header: "Nome",
                  cellClassName: "text-white font-medium",
                  render: (s: Student) => s.fullName,
                },
                {
                  header: "Email",
                  cellClassName: "text-slate-300",
                  render: (s: Student) => s.email,
                },
                {
                  header: "WhatsApp",
                  cellClassName: "text-slate-300",
                  render: (s: Student) => s.phone,
                },
                {
                  header: "Instrumentos",
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
                  render: (s: Student) => (
                    <ActionsDataTable
                      viewStudent={() => viewStudent(s)}
                      editStudent={() => editStudent(s)}
                      deleteStudent={() => deleteStudent(s.id)}
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
    </div>
  );
}
