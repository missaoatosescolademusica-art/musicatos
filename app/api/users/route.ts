import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthInfo } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth || auth.role !== "admin") {
      console.warn("users_list_forbidden", { userId: auth?.userId, role: auth?.role })
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)))
    const q = (searchParams.get("q") || "").trim()
    const email = (searchParams.get("email") || "").trim()

    let where: any = {}
    const OR: any[] = []
    if (q) OR.push({ name: { contains: q, mode: "insensitive" } })
    if (q) OR.push({ email: { contains: q, mode: "insensitive" } })
    if (email) OR.push({ email: { contains: email, mode: "insensitive" } })
    if (OR.length > 0) where.OR = OR

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { role: true },
      }),
      prisma.user.count({ where }),
    ])

    console.info("users_list_success", { count: users.length, page, total })
    return NextResponse.json({
      data: users.map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, role: u.role.name })),
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("users_list_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
