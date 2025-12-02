import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOrigin, verifyCsrf, validateEmail } from "@/lib/auth"
import { sendEmailNative } from "@/lib/email"
import { randomBytes } from "node:crypto"

function tokenGen() {
  const bytes = randomBytes(24)
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

export async function POST(request: NextRequest) {
  try {
    const ok = verifyOrigin(request)
    const csrfCookie = request.cookies.get("csrfToken")?.value
    if (!ok || !verifyCsrf(request, csrfCookie)) return NextResponse.json({ message: "Requisição inválida" }, { status: 400 })
    const { email, locale } = await request.json().catch(() => ({ email: "", locale: "pt" }))
    if (!validateEmail(String(email || ""))) return NextResponse.json({ message: "Email inválido" }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ message: "Conta não encontrada" }, { status: 404 })
    const token = tokenGen()
    const expiresMs = 24 * 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + expiresMs)
    const rec = await prisma.passwordReset.create({ data: { userId: user.id, code: "email", token, expiresAt } })
    const url = new URL(`/reset-password/${token}`, request.url)
    const subject = locale === "en" ? "Password reset" : "Redefinição de senha"
    const logo = new URL(`/Logo.jpg`, request.url).toString()
    const title = locale === "en" ? "Reset your password" : "Redefina sua senha"
    const intro = locale === "en" ? "You requested a password reset. Click the button below to create a new password." : "Você solicitou a redefinição de senha. Clique no botão abaixo para definir uma nova senha."
    const ctaLabel = locale === "en" ? "Reset Password" : "Redefinir senha"
    const ignore = locale === "en" ? "If you did not request this, you can ignore this email." : "Se você não solicitou, pode ignorar este email."
    const expires = locale === "en" ? "This link expires in 24 hours." : "Este link expira em 24 horas."
    const html = `<!DOCTYPE html><html lang="${locale}"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title></head><body style="margin:0;padding:0;background:#0f1115;">\n<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#0b0c10,#1a1d24);padding:24px 0;">\n  <tr>\n    <td align="center">\n      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#12151b;border-radius:12px;overflow:hidden;border:1px solid #2a2f3a;">\n        <tr>\n          <td align="center" style="padding:24px 24px 0 24px;">\n            <img src="${logo}" alt="Logo" width="96" height="96" style="display:block;border-radius:50%;border:2px solid #2a2f3a;" />\n          </td>\n        </tr>\n        <tr>\n          <td style="padding:24px 24px 8px 24px;">\n            <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:28px;color:#e6e8eb;text-align:center;">${title}</h1>\n          </td>\n        </tr>\n        <tr>\n          <td style="padding:0 24px 16px 24px;">\n            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#b3b8c4;text-align:center;">${intro}</p>\n          </td>\n        </tr>\n        <tr>\n          <td align="center" style="padding:8px 24px 24px 24px;">\n            <a href="${url.toString()}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;padding:12px 20px;border-radius:8px;border:1px solid #1e4ed6;">${ctaLabel}</a>\n          </td>\n        </tr>\n        <tr>\n          <td style="padding:0 24px 24px 24px;">\n            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#8a8f9b;text-align:center;">${expires}</p>\n          </td>\n        </tr>\n        <tr>\n          <td style="padding:0 24px 32px 24px;">\n            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#6f7480;text-align:center;">${ignore}</p>\n          </td>\n        </tr>\n      </table>\n    </td>\n  </tr>\n</table>\n</body></html>`
    await sendEmailNative(email, subject, html)
    console.info("password_email_sent", { userId: user.id, tokenCreatedAt: rec.createdAt.toISOString(), expiresAt: rec.expiresAt.toISOString() })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("password_email_request_error", e)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
