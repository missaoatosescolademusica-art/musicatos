import { NextResponse } from "next/server"
import { issueCsrfToken } from "@/lib/auth"

export async function GET() {
  const token = issueCsrfToken()
  const res = NextResponse.json({ csrfToken: token })
  res.cookies.set("csrfToken", token, { httpOnly: false, sameSite: "lax", path: "/" })
  return res
}
