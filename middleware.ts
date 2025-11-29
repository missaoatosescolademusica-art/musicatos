import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth")?.value
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret")
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", request.nextUrl.pathname)
    const res = NextResponse.redirect(url)
    res.cookies.set("auth", "", { maxAge: 0, path: "/" })
    return res
  }
}

export const config = {
  matcher: ["/dashboard"],
}
