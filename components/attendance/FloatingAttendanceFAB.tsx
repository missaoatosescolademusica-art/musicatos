"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ClipboardList, ChevronDown } from "lucide-react"
import { useAuth } from "@/app/dashboard/contexts/auth-context"

type RosterItem = {
  attendanceId?: string | null
  status?: "PRESENT" | "ABSENT" | "LATE" | null
  timestamp?: string | null
  student: { id: string; fullName: string; email: string }
}

function todayStr() {
  const d = new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`
}

export default function FloatingAttendanceFAB() {
  const { me } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<RosterItem[]>([])
  //
  const bcRef = useRef<BroadcastChannel | null>(null)

  const fetchRoster = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ mode: "roster", date: todayStr(), page: "1", limit: "500" })
      const res = await fetch(`/api/attendance?${params.toString()}`)
      const json = await res.json()
      if (res.ok) setList(json.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) fetchRoster() }, [open])

  const grouped = useMemo(() => {
    const present: RosterItem[] = [], absent: RosterItem[] = [], unmarked: RosterItem[] = [], late: RosterItem[] = []
    for (const a of list) {
      if (a.status === "PRESENT") present.push(a)
      else if (a.status === "ABSENT") absent.push(a)
      else if (a.status === "LATE") late.push(a)
      else unmarked.push(a)
    }
    return { present, absent, late, unmarked }
  }, [list])

  const [openAcc, setOpenAcc] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("attendance_accordion_open")
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem("attendance_accordion_open")
      if (raw) setOpenAcc(JSON.parse(raw))
    } catch {}
  }, [])

  const markBatch = async (items: RosterItem[], status: "PRESENT" | "ABSENT" | "LATE") => {
    setLoading(true)
    try {
      const reqs = items.map((a) => fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: a.student.id, status })
      }))
      const resps = await Promise.all(reqs)
      const ok = resps.every((r) => r.ok)
      if (ok) {
        toast.success(`Marcados como ${status.toLowerCase()}`)
        await fetchRoster()
      } else {
        toast.error("Falha ao marcar em lote")
      }
    } catch {
      toast.error("Erro de rede ao marcar em lote")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!me) return
    const CHK_INTERVAL = 15 * 60 * 1000
    const key = "attendance_last_alert"
    bcRef.current = new BroadcastChannel("attendance-alert")
    bcRef.current.onmessage = (ev) => {
      if (ev.data?.type === "alert") showAlert(ev.data.payload)
    }
    const tick = async () => {
      try {
        const params = new URLSearchParams({ mode: "roster", date: todayStr(), status: "UNMARKED", page: "1", limit: "50" })
        const res = await fetch(`/api/attendance?${params.toString()}`)
        const json = await res.json()
        if (!res.ok) return
        const count = (json.data || []).length
        const names = (json.data || []).slice(0, 3).map((x: any) => x.student.fullName)
        const payload = { count, names }
        const last = JSON.parse(localStorage.getItem(key) || "{}")
        if (last.count === count && (Date.now() - (last.ts || 0)) < CHK_INTERVAL) return
        localStorage.setItem(key, JSON.stringify({ count, ts: Date.now() }))
        bcRef.current?.postMessage({ type: "alert", payload })
        showAlert(payload)
      } catch {}
    }
    const id = setInterval(tick, CHK_INTERVAL)
    tick()
    return () => { clearInterval(id); bcRef.current?.close(); bcRef.current = null }
  }, [me])

  function showAlert(payload: { count: number; names: string[] }) {
    if (!me) return
    const id = "attendance-unmarked-toast"
    const desc = payload.count > 0 ? `${payload.count} sem marcação` : "Nenhum aluno sem marcação"
    toast.dismiss(id as any)
    toast(desc, {
      id: id as any,
      description: payload.names.join(", "),
      action: payload.count > 0 ? { label: "Abrir chamada", onClick: () => setOpen(true) } : undefined,
      duration: payload.count > 0 ? Infinity : 5000,
    })
  }

  if (!me) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label="Abrir lista de chamada"
          className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 p-0 bg-blue-600 hover:bg-blue-700 shadow-xl focus-visible:ring-[3px]"
        >
          <ClipboardList className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-5xl bg-slate-900 border border-slate-700 p-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Resumo de Presença</DialogTitle>
            <DialogDescription>Totais e lista detalhada por categoria</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded p-4"><p className="text-slate-400 text-sm">Presente</p><p className="text-3xl font-bold text-green-400">{grouped.present.length}</p></div>
            <div className="bg-slate-800 border border-slate-700 rounded p-4"><p className="text-slate-400 text-sm">Ausente</p><p className="text-3xl font-bold text-red-400">{grouped.absent.length}</p></div>
            <div className="bg-slate-800 border border-slate-700 rounded p-4"><p className="text-slate-400 text-sm">Atraso</p><p className="text-3xl font-bold text-yellow-400">{grouped.late.length}</p></div>
            <div className="bg-slate-800 border border-slate-700 rounded p-4"><p className="text-slate-400 text-sm">Sem marcação</p><p className="text-3xl font-bold text-slate-300">{grouped.unmarked.length}</p></div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            {[{ title: "Presente", items: grouped.present, color: "text-green-400" }, { title: "Ausente", items: grouped.absent, color: "text-red-400" }, { title: "Sem marcação", items: grouped.unmarked, color: "text-slate-300" }].map((section, idx) => (
              <details
                key={idx}
                className="group bg-slate-800 border border-slate-700 rounded"
                open={!!openAcc[section.title]}
                onToggle={(e) => {
                  const isOpen = (e.currentTarget as HTMLDetailsElement).open
                  setOpenAcc((prev) => {
                    const next = { ...prev, [section.title]: isOpen }
                    try { localStorage.setItem("attendance_accordion_open", JSON.stringify(next)) } catch {}
                    return next
                  })
                }}
              >
                <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between gap-2 select-none">
                  <h3 className={`font-semibold ${section.color}`}>{section.title}</h3>
                  <ChevronDown className="h-4 w-4 text-slate-300 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="px-4">
                  <div className="pb-2 flex items-center justify-between gap-2 flex-wrap">
                    {section.title !== "Sem marcação" ? (
                      <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-slate-200" onClick={() => markBatch(section.items, section.title === "Presente" ? "PRESENT" : "ABSENT")} disabled={loading || section.items.length === 0}>Marcar em lote</Button>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-slate-200" onClick={() => markBatch(section.items, "PRESENT")} disabled={loading || section.items.length === 0}>Todos Presente</Button>
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-slate-200" onClick={() => markBatch(section.items, "ABSENT")} disabled={loading || section.items.length === 0}>Todos Ausente</Button>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 max-h-72 overflow-hidden opacity-0 transition-all duration-300 group-open:max-h-72 group-open:opacity-100 group-open:py-3">
                    {section.items.map((a) => (
                      <li key={a.student.id} className="text-white font-medium">
                        {a.student.fullName}
                      </li>
                    ))}
                    {section.items.length === 0 && <li className="text-slate-400 text-sm">Nenhum aluno nesta categoria</li>}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
