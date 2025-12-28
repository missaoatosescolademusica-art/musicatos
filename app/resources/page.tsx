"use client"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/app/dashboard/contexts/auth-context"
import DataTable, { Column } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ResourceType = "pdf" | "mp3" | "youtube"
type Resource = {
  id: string;
  type: ResourceType;
  path: string;
  categoryPath: string;
  originalName: string;
  size?: string | number | null;
  createdAt?: string;
};

function formatBytes(b?: string | number | null) {
  const n = typeof b === "string" ? Number(b) : (b || 0)
  if (!n) return "-"
  const units = ["B","KB","MB","GB"]
  let i = 0; let x = n
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++ }
  return `${x.toFixed(1)} ${units[i]}`
}

export default function ResourcesPage() {
  const { me, authChecked } = useAuth();
  const isAuthed = authChecked && !!me;
  const canManage =
    isAuthed && (me!.role === "admin" || me!.role === "professor");

  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState<ResourceType | "">("");
  const [uploading, setUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Dialog states
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [editForm, setEditForm] = useState({
    originalName: "",
    categoryPath: "",
    url: "",
  });

  useEffect(() => {
    if (isAuthed) load(page);
  }, [isAuthed]);

  const load = async (p = 1) => {
    if (!canManage) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "10");
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      const res = await fetch(`/api/resources?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setItems(json.data || []);
        setPage(json.page || 1);
        setTotalPages(json.totalPages || 1);
      } else {
        toast.error("Erro ao carregar recursos");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async () => {
    if (!canManage) return;
    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (category) fd.append("categoryPath", category); // Optional if supported for files
        const res = await fetch("/api/resources", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(String(j.message || "Falha no upload"));
        toast.success("Arquivo enviado com sucesso");
        await load(page);
        setFile(null);
      } catch (e: any) {
        console.error("resources_ui_upload_error", e);
        toast.error(e.message || "Erro ao enviar arquivo");
      } finally {
        setUploading(false);
      }
    }
  };

  const onCreateYouTube = async () => {
    if (!canManage || !ytUrl) return;
    setUploading(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: ytUrl, categoryPath: category }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(String(j.message || "Falha ao cadastrar URL"));
      toast.success("URL cadastrada com sucesso");
      await load(page);
      setYtUrl("");
      // Don't clear category immediately as user might want to add multiple in same category
    } catch (e: any) {
      console.error("resources_ui_youtube_error", e);
      toast.error(e.message || "Erro ao cadastrar URL");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!canManage || !resourceToDelete) return;
    try {
      const res = await fetch(`/api/resources/${resourceToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Recurso excluído com sucesso");
        await load(page);
      } else {
        toast.error("Falha ao excluir recurso");
      }
    } catch {
      toast.error("Erro ao tentar excluir");
    } finally {
      setResourceToDelete(null);
    }
  };

  const openEdit = (r: Resource) => {
    setResourceToEdit(r);
    setEditForm({
      originalName: r.originalName,
      categoryPath: r.categoryPath || "",
      url: r.type === "youtube" ? r.path : "",
    });
  };

  const saveEdit = async () => {
    if (!canManage || !resourceToEdit) return;
    try {
      const body: any = {
        originalName:
          resourceToEdit.type !== "youtube" ? editForm.originalName : undefined,
        categoryPath: editForm.categoryPath,
        url: resourceToEdit.type === "youtube" ? editForm.url : undefined,
      };

      const res = await fetch(`/api/resources/${resourceToEdit.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Recurso atualizado");
        await load(page);
        setResourceToEdit(null);
      } else {
        toast.error("Falha ao atualizar recurso");
      }
    } catch {
      toast.error("Erro ao salvar alterações");
    }
  };

  const columns: Column<Resource>[] = useMemo(
    () => [
      {
        header: "Tipo",
        render: (r) => (
          <span
            className={
              r.type === "pdf"
                ? "bg-slate-700 text-slate-100 px-2 py-1 rounded"
                : r.type === "mp3"
                ? "bg-green-700 text-white px-2 py-1 rounded"
                : "bg-red-700 text-white px-2 py-1 rounded"
            }
          >
            {r.type.toUpperCase()}
          </span>
        ),
      },
      {
        header: "Nome",
        render: (r) => <span className="text-slate-200">{r.originalName}</span>,
      },
      {
        header: "Caminho/URL",
        render: (r) => (
          <span className="text-slate-400 break-all">{r.path}</span>
        ),
      },
      {
        header: "Categoria Youtube",
        render: (r) => (
          <span className="text-slate-400 break-all">{r.categoryPath}</span>
        ),
      },
      {
        header: "Tamanho",
        render: (r) => (
          <span className="text-slate-300">{formatBytes(r.size as any)}</span>
        ),
      },
      {
        header: "Criado em",
        render: (r) => (
          <span className="text-slate-300">
            {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        header: "Ações",
        render: (r) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              onClick={() => openEdit(r)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-red-700 border-red-600 text-white hover:bg-red-600"
              onClick={() => setResourceToDelete(r.id)}
            >
              Excluir
            </Button>
          </div>
        ),
      },
    ],
    [page]
  );

  return (
    <main className="flex-1 w-full min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-300 text-center">
          Recursos (PDF, MP3, YouTube)
        </h1>
        {!canManage && (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-2">
            Acesso restrito a professores e administradores.
          </p>
        )}

        {canManage && (
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label htmlFor="type" className="text-slate-300">
                Tipo
              </Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="bg-slate-700 border-slate-600 text-white rounded p-2 w-full"
              >
                <option value="">Todos</option>
                <option value="pdf">PDF</option>
                <option value="mp3">MP3</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div>
              <Label htmlFor="q" className="text-slate-300">
                Buscar
              </Label>
              <Input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nome ou caminho"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => load(1)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Filtrar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setType("");
                  setQ("");
                  load(1);
                }}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Limpar
              </Button>
            </div>
          </div>
        )}

        {canManage && (
          <div className="mt-4 bg-slate-800 border border-slate-700 rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-700 p-4">
              <h2 className="text-slate-200 font-semibold">
                Upload de PDF/MP3
              </h2>
              <p className="text-slate-400 text-sm">
                Tipos permitidos: PDF, MP3. Máx: 10MB.
              </p>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept="application/pdf,audio/mpeg"
                className="mt-2 text-slate-300"
                aria-label="Selecionar arquivo"
              />
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={onUpload}
                  disabled={!file || uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Enviar
                </Button>
                {file && (
                  <span className="text-slate-400 text-sm">
                    {file.name} • {formatBytes(file.size)}
                  </span>
                )}
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-4">
              <h2 className="text-slate-200 font-semibold">
                Cadastrar URL do YouTube
              </h2>
              <p className="text-slate-400 text-sm">
                Ex.: https://www.youtube.com/watch?v=dQw4w9WgXcQ
              </p>
              <div className="flex flex-col gap-3 mt-2">
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="URL do vídeo"
                  className="bg-slate-700 border-slate-600 text-white"
                  aria-label="URL do YouTube"
                />
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Categoria (ex: Violão Clássico)"
                  className="bg-slate-700 border-slate-600 text-white"
                  aria-label="Categoria da URL do YouTube"
                />
              </div>
              <div className="mt-3">
                <Button
                  onClick={onCreateYouTube}
                  disabled={!ytUrl || uploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Cadastrar
                </Button>
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
            onPageChange={(p) => {
              setPage(p);
              load(p);
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!resourceToDelete}
        onOpenChange={(o) => !o && setResourceToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este recurso? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!resourceToEdit}
        onOpenChange={(o) => !o && setResourceToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Recurso</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {resourceToEdit?.type !== "youtube" && (
              <div>
                <Label>Nome Original</Label>
                <Input
                  value={editForm.originalName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      originalName: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            {resourceToEdit?.type === "youtube" && (
              <div>
                <Label>URL</Label>
                <Input
                  value={editForm.url}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>
            )}
            <div>
              <Label>Categoria</Label>
              <Input
                value={editForm.categoryPath}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    categoryPath: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceToEdit(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
