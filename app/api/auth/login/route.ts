import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { validateEmail, comparePassword, generateJwt, verifyOrigin, verifyCsrf } from "@/lib/auth"
import { rateLimit } from "@/lib/rateLimiter"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    const rl = rateLimit(`login:${ip}`)
    if (!rl.allowed) return NextResponse.json({ message: "Muitas tentativas" }, { status: 429 })

    const okOrigin = verifyOrigin(request)
    const csrfCookie = request.cookies.get("csrfToken")?.value
    const okCsrf = verifyCsrf(request, csrfCookie)
    if (!okOrigin || !okCsrf) return NextResponse.json({ message: "CSRF inválido" }, { status: 403 })

    const body = await request.json()
    const email = String(body.email || "")
    const password = String(body.password || "")
    if (!validateEmail(email) || !password) return NextResponse.json({ message: "Credenciais inválidas" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    if (!user) return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 })
    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 })

    const token = generateJwt({ sub: user.id, role: user.role.name })
    const res = NextResponse.json({ token })
    res.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    })
    return res
  } catch (error) {
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
