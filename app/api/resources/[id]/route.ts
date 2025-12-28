import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthInfo } from "@/lib/auth"
import fs from "fs"
import path from "path"
import { Prisma } from "@prisma/client"

function ensureAuthRole(role: string | undefined) {
  return role === "admin" || role === "professor"
}

function absoluteFromRelative(rel: string) {
  const safeRel = rel.startsWith("/") ? rel.slice(1) : rel
  return path.join(process.cwd(), "public", safeRel)
}

async function safeAudit(data: any) {
  try {
    await prisma.auditLog.create({ data })
  } catch (error) {
    console.error("Audit log failed:", error)
    // Non-blocking failure for audit
  }
}

function handleApiError(error: any, context: string) {
  console.error(context, error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Dados duplicados" }, { status: 409 })
    }
    // P2003: Foreign key constraint failed
    if (error.code === "P2003") {
      return NextResponse.json({ message: "Violação de integridade (chave estrangeira)" }, { status: 400 })
    }
    // P2025: Record not found
    if (error.code === "P2025") {
      return NextResponse.json({ message: "Registro não encontrado" }, { status: 404 })
    }
  }

  return NextResponse.json(
    { message: "Erro interno no servidor", details: error instanceof Error ? error.message : String(error) }, 
    { status: 500 }
  )
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.resource.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ message: "Não encontrado" }, { status: 404 })
    const resource = { ...item, size: item.size != null ? Number(item.size) : null }
    return NextResponse.json({ resource })
  } catch (error) {
    return handleApiError(error, "resources_get_error")
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
    if (typeof body.categoryPath === "string") updates.categoryPath = body.categoryPath.trim()
    
    if (existing.type === "youtube" && typeof body.url === "string") {
      const url = body.url.trim()
      if (!/^https?:\/\/(www\.)?youtube\.com\//.test(url) && !/^https?:\/\/youtu\.be\//.test(url)) {
        return NextResponse.json({ message: "URL do YouTube inválida" }, { status: 400 })
      }
      updates.path = url
    }
    
    if (Object.keys(updates).length === 0) return NextResponse.json({ message: "Nada a atualizar" }, { status: 400 })
    
    const updated = await prisma.resource.update({ where: { id: params.id }, data: updates })
    
    await safeAudit({ 
      action: "UPDATE", 
      entity: "Resource", 
      entityId: updated.id, 
      userId: auth.userId, 
      metadata: updates 
    })
    
    const resource = { ...updated, size: updated.size != null ? Number(updated.size) : null }
    return NextResponse.json({ resource })
  } catch (error) {
    return handleApiError(error, "resources_update_error")
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
      try {
        if (fs.existsSync(abs)) {
          fs.unlinkSync(abs);
        }
      } catch (err) {
        console.error(`Failed to delete file ${abs}:`, err);
        // Continue to delete DB record even if file deletion fails
      }
    }

    await prisma.resource.delete({ where: { id: params.id } })
    
    await safeAudit({ 
      action: "DELETE", 
      entity: "Resource", 
      entityId: params.id, 
      userId: auth.userId 
    })
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, "resources_delete_error")
  }
}
