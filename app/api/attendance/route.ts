import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthInfo } from "@/lib/auth"

async function getAuthUserId(req: NextRequest) {
  const auth = await getAuthInfo(req)
  return auth?.userId || null
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)))
    const status = searchParams.get("status") as any
    const date = searchParams.get("date")
    const q = searchParams.get("q")
    const mode = searchParams.get("mode") || "list"
    const instrument = searchParams.get("instrument") || ""
    const availableParam = searchParams.get("available")
    const available = availableParam === "true" ? true : availableParam === "false" ? false : undefined

    console.debug("attendance_get_params", { page, limit, status, date, q, mode })

    if (mode === "roster") {
      const baseWhere: any = {}
      if (q) baseWhere.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { nameFather: { contains: q, mode: "insensitive" } },
        { nameMother: { contains: q, mode: "insensitive" } },
      ]
      if (instrument) baseWhere.instruments = { has: instrument }
      if (typeof available === "boolean") baseWhere.available = available

      const [students, totalStudents] = await Promise.all([
        prisma.student.findMany({
          where: baseWhere,
          orderBy: { fullName: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.student.count({ where: baseWhere }),
      ])

      let byDate: Record<string, any> = {}
      if (date) {
        const [yy, mm, dd] = date.split("-").map(n => Number(n))
        const start = new Date(yy, (mm || 1) - 1, dd || 1, 0, 0, 0, 0)
        const end = new Date(yy, (mm || 1) - 1, dd || 1, 23, 59, 59, 999)
        const att = await prisma.attendance.findMany({ where: { timestamp: { gte: start, lte: end } } })
        byDate = Object.fromEntries(att.map(a => [a.studentId, a]))
      }

      let data = students.map(s => {
        const a = byDate[s.id]
        return {
          attendanceId: a?.id ?? null,
          status: a?.status ?? null,
          timestamp: a?.timestamp ?? null,
          student: { id: s.id, fullName: s.fullName, nameFather: s.nameFather, nameMother: s.nameMother },
        }
      })

      if (status) {
        if (status === "UNMARKED") data = data.filter(x => !x.status)
        else data = data.filter(x => x.status === status)
      }

      console.debug("attendance_roster_count", { total: data.length, page, totalPages: Math.max(1, Math.ceil(totalStudents / limit)), instrument, available })
      return NextResponse.json({ data, page, totalPages: Math.max(1, Math.ceil(totalStudents / limit)) })
    }

    const where: any = {}
    if (status) where.status = status
    if (date) {
      const [yy, mm, dd] = date.split("-").map(n => Number(n))
      const start = new Date(yy, (mm || 1) - 1, dd || 1, 0, 0, 0, 0)
      const end = new Date(yy, (mm || 1) - 1, dd || 1, 23, 59, 59, 999)
      where.timestamp = { gte: start, lte: end }
    }

    const [items, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { student: true },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ])

    let data = items
    if (q) {
      const qq = q.toLowerCase()
      data = data.filter((a) => a.student.fullName.toLowerCase().includes(qq) || a.student.nameFather.toLowerCase().includes(qq) || a.student.nameMother.toLowerCase().includes(qq))
    }

    console.debug("attendance_list_count", { total: data.length, page, totalPages: Math.max(1, Math.ceil(total / limit)) })
    return NextResponse.json({ data, page, totalPages: Math.max(1, Math.ceil(total / limit)) })
  } catch (error) {
    console.error("attendance_list_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    console.debug("attendance_post_auth", { userId: auth.userId, role: auth.role })
    if (!["admin", "professor"].includes(auth.role)) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    const body = await request.json()
    const studentId = String(body.studentId || "")
    const status = String(body.status || "") as any
    const notes = body.notes ? String(body.notes) : undefined
    if (!studentId || !["PRESENT", "ABSENT", "LATE"].includes(status)) return NextResponse.json({ message: "Dados inválidos" }, { status: 400 })

    const userExists = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!userExists) return NextResponse.json({ message: "Usuário inválido" }, { status: 403 })
    const studentExists = await prisma.student.findUnique({ where: { id: studentId } })
    if (!studentExists) return NextResponse.json({ message: "Aluno inválido" }, { status: 404 })

    const created = await prisma.attendance.create({
      data: { studentId, status, markedById: auth.userId, notes },
      include: { student: true },
    })

    await prisma.auditLog.create({
      data: { action: "CREATE", entity: "Attendance", entityId: created.id, userId: auth.userId, metadata: { status, studentId } },
    })

    return NextResponse.json({ attendance: created }, { status: 201 })
  } catch (error) {
    console.error("attendance_create_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
