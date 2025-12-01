import { NextRequest, NextResponse } from "next/server"
import { verifyOrigin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const ok = verifyOrigin(request)
  if (!ok) {
    console.warn("logout_origin_invalid", { origin: request.headers.get("origin"), host: request.headers.get("host") })
    return NextResponse.json({ message: "Origem inválida" }, { status: 403 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set("auth", "", { maxAge: 0, path: "/" })
  console.info("logout_cookie_cleared")
  return res
}
