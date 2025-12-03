import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthInfo } from "@/lib/auth"
import fs from "fs"
import path from "path"

function ensureAuthRole(role: string | undefined) {
  return role === "admin" || role === "professor"
}

function absoluteFromRelative(rel: string) {
  const safeRel = rel.startsWith("/") ? rel.slice(1) : rel
  return path.join(process.cwd(), "public", safeRel)
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.resource.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ message: "Não encontrado" }, { status: 404 })
    return NextResponse.json({ resource: item })
  } catch (error) {
    console.error("resources_get_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth || !ensureAuthRole(auth.role)) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    const existing = await prisma.resource.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ message: "Não encontrado" }, { status: 404 })
    const body = await request.json().catch(() => ({}))
    const updates: any = {}
    if (typeof body.originalName === "string") updates.originalName = body.originalName.replace(/[\r\n\t\\<>:"|?*]/g, "").trim()
    if (existing.type === "youtube" && typeof body.url === "string") {
      const url = body.url.trim()
      if (!/^https?:\/\/(www\.)?youtube\.com\//.test(url) && !/^https?:\/\/youtu\.be\//.test(url)) {
        return NextResponse.json({ message: "URL do YouTube inválida" }, { status: 400 })
      }
      updates.path = url
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ message: "Nada a atualizar" }, { status: 400 })
    const updated = await prisma.resource.update({ where: { id: params.id }, data: updates })
    await prisma.auditLog.create({ data: { action: "UPDATE", entity: "Resource", entityId: updated.id, userId: auth.userId, metadata: updates } })
    return NextResponse.json({ resource: updated })
  } catch (error) {
    console.error("resources_update_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth || !ensureAuthRole(auth.role)) return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    const existing = await prisma.resource.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ message: "Não encontrado" }, { status: 404 })

    if (existing.type === "pdf" || existing.type === "mp3") {
      const abs = absoluteFromRelative(existing.path)
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs) } catch {}
    }

    await prisma.resource.delete({ where: { id: params.id } })
    await prisma.auditLog.create({ data: { action: "DELETE", entity: "Resource", entityId: params.id, userId: auth.userId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("resources_delete_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
