import { NextRequest, NextResponse } from "next/server"
import { getAuthInfo } from "@/lib/auth"
import { revokeSession } from "@/lib/sessions"

export async function POST(request: NextRequest) {
  const auth = await getAuthInfo(request)
  if (!auth || auth.role !== "admin") return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
  const { jti } = await request.json().catch(() => ({ jti: "" }))
  if (!jti) return NextResponse.json({ message: "jti obrigatório" }, { status: 400 })
  const ok = await revokeSession(String(jti))
  console.info("impersonate_revoked", { admin: auth.userId, jti })
  return NextResponse.json({ ok })
}
