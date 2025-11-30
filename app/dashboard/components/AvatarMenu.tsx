"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import * as DropdownMenu from "@/components/ui/dropdown-menu"
import { LogOut, Palette, Camera } from "lucide-react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import AvatarStatus from "@/components/shared/AvatarStatus"
import { useStatus } from "../contexts/status-context"
import { useTheme } from "next-themes"
import { useAuth } from "../contexts/auth-context"
import { toast } from "sonner"

type Props = {
  name?: string | null
  avatarUrl?: string
  onLogout: () => void
}

export default function AvatarMenu({ name, avatarUrl, onLogout }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { me, setMe } = useAuth()
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(avatarUrl || null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Preferir a URL do servidor; usar localStorage apenas como último recurso
    if (avatarUrl) { setAvatar(avatarUrl); return }
    try {
      const saved = localStorage.getItem("user_avatar")
      if (saved) setAvatar(saved)
    } catch {}
  }, [avatarUrl])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const initial = useMemo(() => (name?.charAt(0)?.toUpperCase() || "U"), [name])
  const { status, register, unregister } = useStatus(me?.id)
  useEffect(() => { if (me?.id) register(me.id); return () => { if (me?.id) unregister(me.id) } }, [me?.id])

  const toggleTheme = () => {
    const current = resolvedTheme || theme || "system"
    const next = current === "dark" ? "light" : "dark"
    setTheme(next)
    try { localStorage.setItem("theme_preference", next) } catch {}
  }

  const onPickFile = () => inputRef.current?.click()

  const handleFile = async (file: File) => {
    if (!file) return
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.")
      return
    }
    const MAX = 2 * 1024 * 1024
    if (file.size > MAX) {
      toast.error("Arquivo muito grande (máx. 2MB)")
      return
    }
    setUploading(true)
    try {
      const dataUrl = await toCircularDataURL(file, 0.85)
      setAvatar(dataUrl)
      // Upload to server
      const fd = new FormData()
      const blob = dataURLtoBlob(dataUrl)
      fd.append("file", blob, "avatar.png")
      const res = await fetch("/api/user/avatar", { method: "POST", body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || "Falha no upload")
      const newUrl = String(json.url || dataUrl)
      setAvatar(newUrl)
      if (me) setMe({ ...me, avatarUrl: newUrl })
      try { localStorage.setItem("user_avatar", String(json.url || dataUrl)) } catch {}
      toast.success("Avatar atualizado")
    } catch (e: any) {
      toast.error(e?.message || "Falha ao processar imagem")
    } finally {
      setUploading(false)
    }
  }

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null
    if (f) handleFile(f)
    e.target.value = ""
  }

  return (
    <>
    <DropdownMenu.DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenu.DropdownMenuTrigger asChild>
        <button
          aria-label="Abrir menu do usuário"
          className="relative inline-flex items-center justify-center rounded-full size-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <AvatarStatus status={status}>
            <AvatarPrimitive.Root className="inline-flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-full align-middle border border-slate-600" key={avatar || "fallback"}>
              {avatar ? (
                <AvatarPrimitive.Image
                  src={avatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  onError={() => setAvatar(null)}
                />
              ) : (
                <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-blue-600 text-white">
                  {initial}
                </AvatarPrimitive.Fallback>
              )}
            </AvatarPrimitive.Root>
          </AvatarStatus>
          {uploading && (
            <span aria-live="polite" className="absolute inset-0 rounded-full bg-black/30 animate-pulse" />
          )}
        </button>
      </DropdownMenu.DropdownMenuTrigger>
      <DropdownMenu.DropdownMenuContent side="bottom" align="end" className="bg-slate-800 border-slate-700 text-slate-200">
        <DropdownMenu.DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          <Palette /> Trocar tema
        </DropdownMenu.DropdownMenuItem>
        <DropdownMenu.DropdownMenuItem onClick={onPickFile} className="cursor-pointer">
          <Camera /> Alterar avatar
        </DropdownMenu.DropdownMenuItem>
        <DropdownMenu.DropdownMenuItem onClick={onLogout} className="cursor-pointer">
          <LogOut /> Logout
        </DropdownMenu.DropdownMenuItem>
      </DropdownMenu.DropdownMenuContent>
    </DropdownMenu.DropdownMenu>
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="hidden"
      onChange={onInputChange}
      aria-hidden
    />
    </>
  )
}

async function toCircularDataURL(file: File, quality = 0.9): Promise<string> {
  const blobUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(blobUrl)
    const nw = img.naturalWidth || img.width
    const nh = img.naturalHeight || img.height
    const size = Math.min(nw, nh)
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    const sx = (nw - size) / 2
    const sy = (nh - size) / 2
    ctx.drawImage(img as any, sx, sy, size, size, 0, 0, size, size)
    ctx.restore()
    return canvas.toDataURL("image/webp", quality)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [meta, content] = dataUrl.split(",")
  const mime = /:(.*?);/.exec(meta)?.[1] || "image/png"
  const bstr = atob(content)
  const len = bstr.length
  const u8 = new Uint8Array(len)
  for (let i = 0; i < len; i++) u8[i] = bstr.charCodeAt(i)
  return new Blob([u8], { type: mime })
}
