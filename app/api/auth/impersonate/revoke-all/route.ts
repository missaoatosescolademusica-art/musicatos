import { NextRequest, NextResponse } from "next/server"
import { getAuthInfo } from "@/lib/auth"
import { revokeAll } from "@/lib/sessions"

export async function POST(request: NextRequest) {
  const auth = await getAuthInfo(request)
  if (!auth || auth.role !== "admin") return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const adminId = body.adminId ? String(body.adminId) : undefined
  const userId = body.userId ? String(body.userId) : undefined
  await revokeAll({ adminId, userId })
  console.info("impersonate_revoke_all", { admin: auth.userId, adminId, userId })
  return NextResponse.json({ ok: true })
}
