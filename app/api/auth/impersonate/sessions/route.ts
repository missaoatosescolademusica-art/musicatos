import { NextRequest, NextResponse } from "next/server"
import { getAuthInfo } from "@/lib/auth"
import { listSessions } from "@/lib/sessions"

export async function GET(request: NextRequest) {
  const auth = await getAuthInfo(request)
  if (!auth || auth.role !== "admin") return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const adminId = searchParams.get("adminId") || undefined
  const userId = searchParams.get("userId") || undefined
  const data = await listSessions({ adminId, userId })
  return NextResponse.json({ sessions: data })
}
