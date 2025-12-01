import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOrigin, verifyCsrf, validatePasswordComplexity, hashPassword } from "@/lib/auth"
import { jwtVerify } from "jose"

export async function POST(request: NextRequest) {
  try {
    const ok = verifyOrigin(request)
    const csrfCookie = request.cookies.get("csrfToken")?.value
    if (!ok || !verifyCsrf(request, csrfCookie)) return NextResponse.json({ message: "Requisição inválida" }, { status: 400 })
    const { token, newPassword } = await request.json().catch(() => ({ token: "", newPassword: "" }))
    if (!validatePasswordComplexity(String(newPassword || ""))) return NextResponse.json({ message: "Senha fraca" }, { status: 400 })
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret")
    const { payload } = await jwtVerify(String(token || ""), secret)
    if (String((payload as any).scope) !== "password_reset") return NextResponse.json({ message: "Token inválido" }, { status: 401 })
    const userId = String(payload.sub || "")
    const jti = String((payload as any).jti || "")
    const rec = await prisma.passwordReset.findUnique({ where: { id: jti } })
    if (!rec || rec.used) return NextResponse.json({ message: "Solicitação inválida" }, { status: 400 })
    if (rec.expiresAt.getTime() < Date.now()) return NextResponse.json({ message: "Código expirado" }, { status: 410 })
    const passwordHash = await hashPassword(String(newPassword))
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    await prisma.passwordReset.update({ where: { id: jti }, data: { used: true } })
    console.info("password_reset_success", { userId })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("password_reset_error", e)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
