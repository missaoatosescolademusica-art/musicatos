import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthInfo } from "@/lib/auth"
import fs from "fs"
import path from "path"

function ensureAuthRole(role: string | undefined) {
  return role === "admin" || role === "professor"
}

function sanitizeName(name: string) {
  return name.replace(/[\r\n\t\\<>:"|?*]/g, "").trim()
}

function uploadsDir() {
  const dir = path.join(process.cwd(), "public", "uploads", "resources")
  try { fs.mkdirSync(dir, { recursive: true }) } catch {}
  return dir
}

function validYouTube(url: string) {
  const trimmed = url.trim()
  const patterns = [
    /^https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/
  ]
  for (const re of patterns) {
    const m = re.exec(trimmed)
    if (m) return { ok: true, id: m[1], url: `https://www.youtube.com/watch?v=${m[1]}` }
  }
  return { ok: false }
}

function toJsonResource(r: any) {
  return { ...r, size: r?.size != null ? Number(r.size) : null };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth || !ensureAuthRole(auth.role)) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)))
    const type = searchParams.get("type") as any
    const q = searchParams.get("q") || ""

    const where: any = {}
    if (type) where.type = type
    if (q) where.OR = [{ originalName: { contains: q, mode: "insensitive" } }, { path: { contains: q, mode: "insensitive" } }]

    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ])
    const data = items.map(toJsonResource);
    return NextResponse.json({
      data,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("resources_list_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth || !ensureAuthRole(auth.role)) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })

    const ct = (request.headers.get("content-type") || "").toLowerCase()
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData()
      const file = form.get("file") as File | null
      if (!file) return NextResponse.json({ message: "Arquivo não enviado" }, { status: 400 })
      const allowed = ["application/pdf", "audio/mpeg"]
      if (!allowed.includes(file.type)) return NextResponse.json({ message: "Tipo inválido" }, { status: 400 })
      const MAX = 10 * 1024 * 1024
      if (file.size > MAX) return NextResponse.json({ message: "Arquivo acima de 10MB" }, { status: 400 })

      const type: "pdf" | "mp3" = file.type === "application/pdf" ? "pdf" : "mp3"
      const originalName = sanitizeName((file as any).name || `file.${type}`)

      // duplicidade (por nome e tamanho)
      const dup = await prisma.resource.findFirst({ where: { type, originalName, size: BigInt(file.size) } })
      if (dup) return NextResponse.json({ message: "Recurso duplicado" }, { status: 409 })

      const buf = Buffer.from(await file.arrayBuffer())
      const ext = type === "pdf" ? ".pdf" : ".mp3"
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const rel = `/uploads/resources/${id}${ext}`
      const abs = path.join(uploadsDir(), `${id}${ext}`)
      fs.writeFileSync(abs, buf)

      const created = await prisma.resource.create({
        data: { type, path: rel, originalName, size: BigInt(file.size), createdById: auth.userId },
      })
      await prisma.auditLog.create({ data: { action: "CREATE", entity: "Resource", entityId: created.id, userId: auth.userId, metadata: { type, path: rel } } })
      return NextResponse.json(
        { resource: toJsonResource(created) },
        { status: 201 }
      );
    } else {
      const body = await request.json().catch(() => ({}))
      const raw = String(body.url || "")
      const ok = validYouTube(raw)
      if (!ok.ok) return NextResponse.json({ message: "URL do YouTube inválida" }, { status: 400 })
      const url = ok.url!
      const dup = await prisma.resource.findFirst({ where: { type: "youtube", path: url } })
      if (dup) return NextResponse.json({ message: "Recurso duplicado" }, { status: 409 })
      const created = await prisma.resource.create({ data: { type: "youtube", path: url, originalName: ok.id!, createdById: auth.userId } })
      await prisma.auditLog.create({ data: { action: "CREATE", entity: "Resource", entityId: created.id, userId: auth.userId, metadata: { type: "youtube", path: url } } })
      return NextResponse.json(
        { resource: toJsonResource(created) },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("resources_create_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
