import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOrigin, verifyCsrf, validatePasswordComplexity, hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const ok = verifyOrigin(request)
    const csrfCookie = request.cookies.get("csrfToken")?.value
    if (!ok || !verifyCsrf(request, csrfCookie)) return NextResponse.json({ message: "Requisição inválida" }, { status: 400 })
    const { token, password, confirm } = await request.json().catch(() => ({ token: "", password: "", confirm: "" }))
    if (!token) return NextResponse.json({ message: "Token obrigatório" }, { status: 400 })
    if (String(password) !== String(confirm)) return NextResponse.json({ message: "Senhas diferentes" }, { status: 400 })
    if (!validatePasswordComplexity(String(password))) return NextResponse.json({ message: "Senha fraca" }, { status: 400 })
    const rec = await prisma.passwordReset.findFirst({ where: { token, used: false }, orderBy: { createdAt: "desc" } })
    if (!rec) return NextResponse.json({ message: "Token inválido" }, { status: 400 })
    if (rec.expiresAt.getTime() < Date.now()) {
      console.info("password_email_reset_expired_attempt", { token, userId: rec.userId, expiresAt: rec.expiresAt.toISOString() })
      return NextResponse.json({ message: "Token expirado" }, { status: 410 })
    }
    const passwordHash = await hashPassword(String(password))
    await prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } })
    await prisma.passwordReset.update({ where: { id: rec.id }, data: { used: true } })
    
    console.info("password_email_reset_success", { userId: rec.userId })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("password_email_reset_error", e)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
