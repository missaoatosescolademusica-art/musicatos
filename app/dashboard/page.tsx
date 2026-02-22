"use client";

import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Image from "next/image";

import { StudentsProvider, useStudents } from "./contexts/students-context";
import { useAuth } from "./contexts/auth-context";

import { StudentDialog } from "@/components/student-dialog";
import SearchBar from "@/components/search/SearchBar";
import { ImportStudentsButton } from "./components/ImportStudentsButton";
import DataTable from "@/components/shared/DataTable";
import { ActionsDataTable } from "@/components/shared/ActionsDataTable";
import { Student } from "../types/students";
import FloatingAttendanceFAB from "@/components/attendance/FloatingAttendanceFAB";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

export default function DashboardPage() {
  return (
    <StudentsProvider>
      <DashboardContent />
    </StudentsProvider>
  );
}

function DashboardContent() {
  const {
    students,
    loading,
    searchQuery,
    setSearchQuery: _setSearchQuery,
    phoneFilter,
    setPhoneFilter,
    instrumentFilter,
    setInstrumentFilter,
    availableFilter,
    setAvailableFilter,
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
  const { me } = useAuth();

  const itemsPerPage = 10;

  const [instrumentOptions, setInstrumentOptions] = React.useState<string[]>(
    [],
  );

  useEffect(() => {
    fetchStudents();
  }, [
    currentPage,
    searchQuery,
    phoneFilter,
    instrumentFilter,
    availableFilter,
  ]);

  const isAdmin = me?.role === "admin";
  const isProfessor = me?.role === "professor";

  useEffect(() => {
    setCurrentPage(1);
  }, [phoneFilter, instrumentFilter, availableFilter, setCurrentPage]);

  useEffect(() => {
    fetch("/api/students?mode=instruments")
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json.instruments) ? json.instruments : [];
        setInstrumentOptions(list);
      })
      .catch(() => {});
  }, []);

  return (
    <main
      className={`flex-1 w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4`}
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
              <Users className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-foreground">
                {isProfessor ? "Painel do Professor" : "Painel Administrativo"}
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-center">
            Gerencie todos os alunos registrados
          </p>
        </div>

        {isAdmin && (
          <div className="flex justify-end mb-4">
            <ImportStudentsButton onSuccess={fetchStudents} />
          </div>
        )}

        <SearchBar placeholder="Buscar por ID do estudante..." />

        {(isProfessor || isAdmin) && (
          <div className="bg-card border border-border rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <Label className="text-muted-foreground">Telefone</Label>
              <Input
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="bg-input border-input text-foreground mt-1"
                placeholder="Ex.: 11 99999-9999"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Instrumento</Label>
              <select
                value={instrumentFilter}
                onChange={(e) => setInstrumentFilter(e.target.value)}
                className="bg-input border border-input text-foreground mt-1 rounded p-2 w-full"
              >
                <option value="">Todos</option>
                {instrumentOptions.map((instrument) => (
                  <option key={instrument} value={instrument}>
                    {instrument}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-muted-foreground">Disponibilidade</Label>
              <select
                value={availableFilter}
                onChange={(e) => setAvailableFilter(e.target.value)}
                className="bg-input border border-input text-foreground mt-1 rounded p-2 w-full"
              >
                <option value="">Todos</option>
                <option value="true">Disponível</option>
                <option value="false">Indisponível</option>
              </select>
            </div>
          </div>
        )}
        <DataTable
          data={students}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={itemsPerPage}
          onPageChange={(p) => setCurrentPage(p)}
          containerClassName="bg-card border-border overflow-hidden shadow-xl"
          headerRowClassName="bg-muted/50"
          bodyRowClassName="border-border hover:bg-muted/50 transition"
          columns={[
            {
              header: "ID",
              headerClassName: "text-muted-foreground font-semibold",
              cellClassName: "text-muted-foreground font-mono text-sm",
              render: (s: Student) => `${s.id.slice(0, 8)}...`,
            },
            {
              header: "Nome",
              headerClassName: "text-muted-foreground font-semibold",
              cellClassName: "text-foreground font-medium",
              render: (s: Student) => s.fullName,
            },
            {
              header: "Pai",
              headerClassName: "text-muted-foreground font-semibold",
              cellClassName: "text-muted-foreground",
              render: (s: Student) => s.nameFather,
            },
            {
              header: "Mãe",
              headerClassName: "text-muted-foreground font-semibold",
              cellClassName: "text-muted-foreground",
              render: (s: Student) => s.nameMother,
            },
            {
              header: "WhatsApp",
              headerClassName: "text-muted-foreground font-semibold",
              cellClassName: "text-muted-foreground",
              render: (s: Student) => s.phone,
            },
            {
              header: "Instrumentos",
              headerClassName: "text-muted-foreground font-semibold",
              render: (s: Student) => (
                <div className="flex gap-1 flex-wrap">
                  {s.instruments.map((instrument) => (
                    <Badge
                      key={instrument}
                      variant="secondary"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
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
      <FloatingAttendanceFAB />
    </main>
  );
}
