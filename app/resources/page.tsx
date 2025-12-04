"use client"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/app/dashboard/contexts/auth-context"
import DataTable, { Column } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ResourceType = "pdf" | "mp3" | "youtube"
type Resource = {
  id: string
  type: ResourceType
  path: string
  originalName: string
  size?: string | number | null
  createdAt?: string
}

function formatBytes(b?: string | number | null) {
  const n = typeof b === "string" ? Number(b) : (b || 0)
  if (!n) return "-"
  const units = ["B","KB","MB","GB"]
  let i = 0; let x = n
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++ }
  return `${x.toFixed(1)} ${units[i]}`
}

export default function ResourcesPage() {
  const { me, authChecked } = useAuth()
  const isAuthed = authChecked && !!me
  const canManage = isAuthed && (me!.role === "admin" || me!.role === "professor")

  const [items, setItems] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [q, setQ] = useState("")
  const [type, setType] = useState<ResourceType | "">("")
  const [uploading, setUploading] = useState(false)
  const [ytUrl, setYtUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { if (isAuthed) load(page) }, [isAuthed])

  const load = async (p = 1) => {
    if (!canManage) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(p))
      params.set("limit", "10")
      if (type) params.set("type", type)
      if (q) params.set("q", q)
      const res = await fetch(`/api/resources?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setItems(json.data || [])
        setPage(json.page || 1)
        setTotalPages(json.totalPages || 1)
      }
    } finally { setLoading(false) }
  }

  const onUpload = async () => {
    if (!canManage) return
    if (file) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/resources", { method: "POST", body: fd })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(String(j.message || "Falha no upload"))
        await load(page)
        setFile(null)
      } catch (e) {
        console.error("resources_ui_upload_error", e)
      } finally { setUploading(false) }
    }
  }

  const onCreateYouTube = async () => {
    if (!canManage || !ytUrl) return
    setUploading(true)
    try {
      const res = await fetch("/api/resources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: ytUrl }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(String(j.message || "Falha ao cadastrar URL"))
      await load(page)
      setYtUrl("")
    } catch (e) {
      console.error("resources_ui_youtube_error", e)
    } finally { setUploading(false) }
  }

  const onDelete = async (id: string) => {
    if (!canManage) return
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" })
      if (res.ok) await load(page)
    } catch {}
  }

  const onUpdate = async (r: Resource) => {
    if (!canManage) return
    const val = prompt(r.type === "youtube" ? "Nova URL do YouTube" : "Novo nome original", r.type === "youtube" ? r.path : r.originalName)
    if (val === null) return
    const body = r.type === "youtube" ? { url: val } : { originalName: val }
    const res = await fetch(`/api/resources/${r.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) await load(page)
  }

  const columns: Column<Resource>[] = useMemo(() => [
    { header: "Tipo", render: (r) => (
      <span className={
        r.type === "pdf" ? "bg-slate-700 text-slate-100 px-2 py-1 rounded" :
        r.type === "mp3" ? "bg-green-700 text-white px-2 py-1 rounded" :
        "bg-red-700 text-white px-2 py-1 rounded"
      }>
        {r.type.toUpperCase()}
      </span>
    ) },
    { header: "Nome", render: (r) => <span className="text-slate-200">{r.originalName}</span> },
    { header: "Caminho/URL", render: (r) => <span className="text-slate-400 break-all">{r.path}</span> },
    { header: "Tamanho", render: (r) => <span className="text-slate-300">{formatBytes(r.size as any)}</span> },
    { header: "Criado em", render: (r) => <span className="text-slate-300">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</span> },
    { header: "Ações", render: (r) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600" onClick={() => onUpdate(r)}>Editar</Button>
        <Button variant="outline" size="sm" className="bg-red-700 border-red-600 text-white hover:bg-red-600" onClick={() => onDelete(r.id)}>Excluir</Button>
      </div>
    ) },
  ], [page])

  return (
    <main className="flex-1 w-full min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-300 text-center">Recursos (PDF, MP3, YouTube)</h1>
        {!canManage && (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-2">Acesso restrito a professores e administradores.</p>
        )}

        {canManage && (
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label htmlFor="type" className="text-slate-300">Tipo</Label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as any)} className="bg-slate-700 border-slate-600 text-white rounded p-2 w-full">
                <option value="">Todos</option>
                <option value="pdf">PDF</option>
                <option value="mp3">MP3</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div>
              <Label htmlFor="q" className="text-slate-300">Buscar</Label>
              <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou caminho" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => load(1)} className="bg-blue-600 hover:bg-blue-700">Filtrar</Button>
              <Button variant="outline" onClick={() => { setType(""); setQ(""); load(1) }} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">Limpar</Button>
            </div>
          </div>
        )}

        {canManage && (
          <div className="mt-4 bg-slate-800 border border-slate-700 rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-700 p-4">
              <h2 className="text-slate-200 font-semibold">Upload de PDF/MP3</h2>
              <p className="text-slate-400 text-sm">Tipos permitidos: PDF, MP3. Máx: 10MB.</p>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="application/pdf,audio/mpeg" className="mt-2 text-slate-300" aria-label="Selecionar arquivo" />
              <div className="mt-3 flex gap-2">
                <Button onClick={onUpload} disabled={!file || uploading} className="bg-green-600 hover:bg-green-700">Enviar</Button>
                {file && <span className="text-slate-400 text-sm">{file.name} • {formatBytes(file.size)}</span>}
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-4">
              <h2 className="text-slate-200 font-semibold">Cadastrar URL do YouTube</h2>
              <p className="text-slate-400 text-sm">Ex.: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
              <Input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="URL do vídeo" className="mt-2 bg-slate-700 border-slate-600 text-white" aria-label="URL do YouTube" />
              <div className="mt-3">
                <Button onClick={onCreateYouTube} disabled={!ytUrl || uploading} className="bg-blue-600 hover:bg-blue-700">Cadastrar</Button>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-6">
          <DataTable<Resource>
            data={items}
            columns={columns}
            loading={loading}
            currentPage={page}
            totalPages={totalPages}
            pageSize={10}
            onPageChange={(p) => { setPage(p); load(p) }}
          />
        </div>
      </div>
    </main>
  )
}
