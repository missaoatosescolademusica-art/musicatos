import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { validateEmail, comparePassword, generateJwt, verifyOrigin, verifyCsrf } from "@/lib/auth"
import { rateLimit } from "@/lib/rateLimiter"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    const rl = rateLimit(`login:${ip}`)
    if (!rl.allowed) {
      console.warn("login_rate_limited", { ip })
      return NextResponse.json({ message: "Muitas tentativas" }, { status: 429 })
    }

    const okOrigin = verifyOrigin(request)
    const csrfCookie = request.cookies.get("csrfToken")?.value
    const okCsrf = verifyCsrf(request, csrfCookie)
    if (!okOrigin || !okCsrf) {
      console.warn("login_csrf_invalid", { ip })
      return NextResponse.json({ message: "CSRF inválido" }, { status: 403 })
    }

    const body = await request.json()
    const email = String(body.email || "")
    const password = String(body.password || "")
    if (!validateEmail(email) || !password) {
      console.warn("login_invalid_input", { email })
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    if (!user) {
      console.warn("login_user_not_found", { email })
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 })
    }
    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) {
      console.warn("login_wrong_password", { email })
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 })
    }

    const token = generateJwt({ sub: user.id, role: user.role.name })
    const res = NextResponse.redirect(new URL("/dashboard", request.url), { status: 302 })
    res.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    })
    return res
  } catch (error) {
    console.error("login_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
