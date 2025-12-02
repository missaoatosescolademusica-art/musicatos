import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOrigin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const ok = verifyOrigin(request)
    if (!ok) return NextResponse.json({ message: "Origem inválida" }, { status: 400 })
    const url = new URL(request.url)
    const token = url.searchParams.get("token") || ""
    if (!token) return NextResponse.json({ message: "Token obrigatório" }, { status: 400 })
    const rec = await prisma.passwordReset.findFirst({ where: { token, used: false }, orderBy: { createdAt: "desc" } })
    if (!rec) return NextResponse.json({ valid: false, reason: "invalid" }, { status: 200 })
    const now = Date.now()
    const remainingMs = Math.max(0, rec.expiresAt.getTime() - now)
    if (remainingMs <= 0) {
      console.info("password_email_link_expired_access", { token, userId: rec.userId, expiresAt: rec.expiresAt.toISOString() })
      return NextResponse.json({ valid: false, reason: "expired", expiresAt: rec.expiresAt.toISOString() }, { status: 200 })
    }
    return NextResponse.json({ valid: true, remainingMs, expiresAt: rec.expiresAt.toISOString(), createdAt: rec.createdAt.toISOString() })
  } catch (e) {
    console.error("password_email_validate_error", e)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
