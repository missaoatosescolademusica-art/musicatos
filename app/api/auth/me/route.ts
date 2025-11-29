import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { jwtVerify } from "jose"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth")?.value

    if (!token) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret")
    const { payload } = await jwtVerify(token, secret)
    const id = String(payload.sub || "")
    
    if (!id) return NextResponse.json({ message: "Token inválido" }, { status: 401 })
    
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } })

    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })

    return NextResponse.json({ id: user.id, name: user.name, role: user.role.name })
  } catch {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 })
  }
}
