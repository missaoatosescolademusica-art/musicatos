"use client";
import { useEffect, useMemo, useState } from "react";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

import FloatingAttendanceFAB from "@/components/attendance/FloatingAttendanceFAB";

type AttendanceItem = {
  attendanceId?: string | null;
  status?: "PRESENT" | "ABSENT" | "LATE" | null;
  timestamp?: string | null;
  student: { id: string; fullName: string; email: string };
};

export default function AttendancePage() {
  return <AttendanceContent />;
}

function AttendanceContent() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AttendanceItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  });
  const [instrument, setInstrument] = useState<string>("");
  const [available, setAvailable] = useState<string>("");

  const fetchList = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "10");
      params.set("mode", "roster");
      if (status) params.set("status", status);
      if (date) params.set("date", date);
      if (q) params.set("q", q);
      if (instrument) params.set("instrument", instrument);
      if (available) params.set("available", available);
      const res = await fetch(`/api/attendance?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        console.info("attendance_ui_fetch_ok", {
          count: json.data?.length ?? 0,
          page: json.page,
          totalPages: json.totalPages,
        });
        setData(json.data);
        setTotalPages(json.totalPages);
      } else {
        console.error("attendance_ui_fetch_error", json);
        toast.error(json.message || "Erro ao carregar lista de chamada");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
  }, []);

  useEffect(() => {
    fetchList(1);
    setPage(1);
  }, [status, date]);

  const mark = async (studentId: string, s: "PRESENT" | "ABSENT" | "LATE") => {
    if (loading) return;
    setLoading(true);
    try {
      console.info("attendance_ui_mark", { studentId, status: s, date });
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, status: s }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Presença registrada");
        if (!date) {
          const d = new Date();
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setDate(`${y}-${m}-${dd}`);
        }
        await fetchList(page);
      } else {
        console.error("attendance_ui_mark_error", json);
        toast.error(json.message || "Falha ao registrar presença");
      }
    } catch (e) {
      console.error("attendance_ui_mark_exception", e);
      toast.error("Erro de rede ao registrar presença");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<AttendanceItem>[] = useMemo(
    () => [
      {
        header: "Aluno",
        headerClassName: "text-foreground font-semibold",
        cellClassName: "text-foreground",
        render: (a) => (
          <div className="flex flex-col">
            <span className="font-medium">{a.student.fullName}</span>
            <span className="text-muted-foreground text-xs">
              {a.student.email}
            </span>
          </div>
        ),
      },
      {
        header: "Status",
        headerClassName: "text-foreground font-semibold",
        render: (a) =>
          a.status ? (
            <Badge
              className={
                a.status === "PRESENT"
                  ? "bg-green-600 text-white"
                  : a.status === "ABSENT"
                    ? "bg-red-600 text-white"
                    : "bg-yellow-600 text-black"
              }
            >
              {a.status === "PRESENT"
                ? "Presente"
                : a.status === "ABSENT"
                  ? "Ausente"
                  : "Atraso"}
            </Badge>
          ) : (
            <Badge className="bg-muted text-muted-foreground">
              Sem marcação
            </Badge>
          ),
      },
      {
        header: "Data/Hora",
        headerClassName: "text-foreground font-semibold",
        cellClassName: "text-muted-foreground",
        render: (a) => (
          <span>
            {a.timestamp ? new Date(a.timestamp).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        header: "Ações",
        headerClassName: "text-foreground font-semibold",
        render: (a) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              aria-disabled={loading}
              className="disabled:opacity-60"
              onClick={() => mark(a.student.id, "PRESENT")}
            >
              Presente
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              aria-disabled={loading}
              className="disabled:opacity-60"
              onClick={() => mark(a.student.id, "ABSENT")}
            >
              Ausente
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              aria-disabled={loading}
              className="disabled:opacity-60"
              onClick={() => mark(a.student.id, "LATE")}
            >
              Atraso
            </Button>
          </div>
        ),
      },
    ],
    [mark],
  );

  const totals = useMemo(() => {
    let present = 0,
      absent = 0,
      late = 0,
      unmarked = 0;
    for (const a of data) {
      if (a.status === "PRESENT") present++;
      else if (a.status === "ABSENT") absent++;
      else if (a.status === "LATE") late++;
      else unmarked++;
    }
    return { present, absent, late, unmarked };
  }, [data]);

  return (
    <main className="w-full min-h-[calc(100vh-3.5rem)] px-4 bg-gradient-to-br from-[#f0e8e0] to-[#a39e98] dark:bg-background dark:bg-none">
      <div className="w-full max-w-5xl mx-auto space-y-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">Lista de Chamada</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded p-4 shadow-sm">
            <p className="text-muted-foreground text-sm">Presente</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totals.present}
            </p>
          </div>
          <div className="bg-card border border-border rounded p-4 shadow-sm">
            <p className="text-muted-foreground text-sm">Ausente</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {totals.absent}
            </p>
          </div>
          <div className="bg-card border border-border rounded p-4 shadow-sm">
            <p className="text-muted-foreground text-sm">Atraso</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {totals.late}
            </p>
          </div>
          <div className="bg-card border border-border rounded p-4 shadow-sm">
            <p className="text-muted-foreground text-sm">Sem marcação</p>
            <p className="text-3xl font-bold text-foreground">
              {totals.unmarked}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-3 shadow-sm">
          <div>
            <Label className="text-foreground">Busca</Label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-input border-input text-foreground mt-1"
              placeholder="Nome ou email"
            />
          </div>
          <div>
            <Label className="text-foreground">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-input border border-input text-foreground mt-1 rounded p-2 w-full"
            >
              <option value="">Todos</option>
              <option value="PRESENT">Presente</option>
              <option value="ABSENT">Ausente</option>
              <option value="LATE">Atraso</option>
              <option value="UNMARKED">Sem marcação</option>
            </select>
          </div>
          <div>
            <Label className="text-foreground">Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-input border-input text-foreground mt-1"
            />
          </div>
          <div>
            <Label className="text-foreground">Instrumento</Label>
            <Input
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="bg-input border-input text-foreground mt-1"
              placeholder="Ex.: Violão"
            />
          </div>
          <div>
            <Label className="text-foreground">Disponível</Label>
            <select
              value={available}
              onChange={(e) => setAvailable(e.target.value)}
              className="bg-input border border-input text-foreground mt-1 rounded p-2 w-full"
            >
              <option value="">Todos</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => fetchList(1)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>

        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          currentPage={page}
          totalPages={totalPages}
          pageSize={10}
          onPageChange={(p) => {
            setPage(p);
            fetchList(p);
          }}
          containerClassName="bg-card border-border overflow-hidden shadow-xl"
          headerRowClassName="bg-muted/50"
          bodyRowClassName="border-border hover:bg-muted/50 transition"
        />
        <FloatingAttendanceFAB />
      </div>
    </main>
  );
}
