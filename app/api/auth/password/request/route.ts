import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOrigin, verifyCsrf } from "@/lib/auth"
import { sendSmsTwilio } from "@/lib/twilio"

function code6() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const ok = verifyOrigin(request)
    const csrfCookie = request.cookies.get("csrfToken")?.value
    if (!ok || !verifyCsrf(request, csrfCookie)) return NextResponse.json({ message: "Requisição inválida" }, { status: 400 })
    const { emailOrPhone, locale } = await request.json().catch(() => ({ emailOrPhone: "", locale: "pt" }))
    const value = String(emailOrPhone || "").trim()
    if (!value) return NextResponse.json({ message: "Informe email ou telefone" }, { status: 400 })
    const isPhone = /^\+?[0-9]{10,15}$/.test(value)
    const user = isPhone
      ? await prisma.user.findFirst({
          where: { phone: value },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.user.findUnique({ where: { email: value } });
    if (!user) return NextResponse.json({ message: "Conta não encontrada" }, { status: 404 })
    const code = code6()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await prisma.passwordReset.create({ data: { userId: user.id, code, expiresAt } })
    if (process.env.TWILIO_TEST_MODE === "true") {
      console.info("twilio_skip_test_mode", { userId: user.id, phone: user.phone })
    } else {
      const phone = user.phone || (isPhone ? value : "")
      if (!phone) return NextResponse.json({ message: "Telefone não cadastrado" }, { status: 400 })
      const text = locale === "en" ? `Your verification code is ${code}` : `Seu código de verificação é ${code}`
      await sendSmsTwilio(phone, text)
    }
    console.info("password_reset_code_sent", { userId: user.id })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("password_reset_request_error", e)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
