import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOrigin, verifyCsrf, generateJwt } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const ok = verifyOrigin(request)
    const csrfCookie = request.cookies.get("csrfToken")?.value
    if (!ok || !verifyCsrf(request, csrfCookie)) return NextResponse.json({ message: "Requisição inválida" }, { status: 400 })
    const { emailOrPhone, code } = await request.json().catch(() => ({ emailOrPhone: "", code: "" }))
    const value = String(emailOrPhone || "").trim()
    const isPhone = /^\+?[0-9]{10,15}$/.test(value)
    const user = isPhone ? await prisma.user.findFirst({ where: { phone: value } }) : await prisma.user.findUnique({ where: { email: value } })
    if (!user) return NextResponse.json({ message: "Conta não encontrada" }, { status: 404 })
    const rec = await prisma.passwordReset.findFirst({ where: { userId: user.id, used: false }, orderBy: { createdAt: "desc" } })
    if (!rec) return NextResponse.json({ message: "Código não encontrado" }, { status: 404 })
    if (rec.attempts >= 3) return NextResponse.json({ message: "Tentativas excedidas" }, { status: 429 })
    if (rec.expiresAt.getTime() < Date.now()) return NextResponse.json({ message: "Código expirado" }, { status: 410 })
    if (String(rec.code) !== String(code)) {
      await prisma.passwordReset.update({ where: { id: rec.id }, data: { attempts: rec.attempts + 1 } })
      return NextResponse.json({ message: "Código inválido" }, { status: 400 })
    }
    const token = generateJwt({ sub: user.id, scope: "password_reset", jti: rec.id }, 600)
    console.info("password_reset_code_verified", { userId: user.id })
    return NextResponse.json({ token })
  } catch (e) {
    console.error("password_reset_verify_error", e)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
