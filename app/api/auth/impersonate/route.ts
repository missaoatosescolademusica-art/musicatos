import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthInfo, generateJwt } from "@/lib/auth"
import { registerImpersonation } from "@/lib/sessions"

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth || auth.role !== "admin") {
      console.warn("impersonate_forbidden", { userId: auth?.userId, role: auth?.role })
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }
    const userId = request.nextUrl.searchParams.get("userId") || ""
    if (!userId) return NextResponse.json({ message: "userId obrigatório" }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    const jti = Math.random().toString(36).slice(2)
    const expiresInSec = 1800
    const token = generateJwt({ sub: user.id, role: user.role.name, jti }, expiresInSec)
    await registerImpersonation(auth.userId, user.id, user.role.name, jti, expiresInSec)
    console.info("impersonate_issue_token", { admin: auth.userId, target: user.id, jti })
    await prisma.auditLog.create({ data: { action: "CREATE", entity: "Impersonation", entityId: user.id, userId: auth.userId, metadata: { targetRole: user.role.name } } })
    return NextResponse.json({ token })
  } catch (error) {
    console.error("impersonate_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
