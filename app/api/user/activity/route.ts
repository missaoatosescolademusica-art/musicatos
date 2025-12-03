import { NextRequest, NextResponse } from "next/server"
import { getAuthInfo } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const status = String(body.status || "")
    const timestamp = Number(body.timestamp || Date.now())
    if (!status) return NextResponse.json({ message: "Dados inválidos" }, { status: 400 })
    await prisma.auditLog.create({ data: { action: "CREATE", entity: "UserActivity", entityId: auth.userId, userId: auth.userId, metadata: { status, timestamp } } })
    console.info("user_activity_recorded", { userId: auth.userId, status })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("user_activity_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
