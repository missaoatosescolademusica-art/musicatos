import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { jwtVerify } from "jose"

async function getAuth(request: NextRequest) {
  const token = request.cookies.get("auth")?.value
  if (!token) return null
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret")
  try {
    const { payload } = await jwtVerify(token, secret)
    return { id: String(payload.sub || ""), role: String(payload.role || "user") }
  } catch {
    return null
  }
}

export async function PUT(request: NextRequest, context: { params: any }) {
  try {
    const auth = await getAuth(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    if (auth.role !== "admin") return NextResponse.json({ message: "Proibido" }, { status: 403 })

    const p = context.params
    const { id } = typeof p?.then === "function" ? await p : p
    if (!id) return NextResponse.json({ message: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const status = String(body.status || "") as any
    const notes = body.notes ? String(body.notes) : undefined
    if (!["PRESENT", "ABSENT", "LATE"].includes(status)) return NextResponse.json({ message: "Status inválido" }, { status: 400 })

    const updated = await prisma.attendance.update({ where: { id }, data: { status, notes }, include: { student: true } })

    await prisma.auditLog.create({ data: { action: "UPDATE", entity: "Attendance", entityId: id, userId: auth.id, metadata: { status } } })

    return NextResponse.json({ attendance: updated })
  } catch (error) {
    console.error("attendance_update_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: any }) {
  try {
    const auth = await getAuth(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    if (auth.role !== "admin") return NextResponse.json({ message: "Proibido" }, { status: 403 })

    const p = context.params
    const { id } = typeof p?.then === "function" ? await p : p
    if (!id) return NextResponse.json({ message: "ID inválido" }, { status: 400 })

    await prisma.attendance.delete({ where: { id } })
    await prisma.auditLog.create({ data: { action: "DELETE", entity: "Attendance", entityId: id, userId: auth.id } })
    return NextResponse.json({ message: "Removido" })
  } catch (error) {
    console.error("attendance_delete_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}

