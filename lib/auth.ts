import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePasswordComplexity(password: string) {
  const length = password.length >= 8
  const upper = /[A-Z]/.test(password)
  const lower = /[a-z]/.test(password)
  const number = /[0-9]/.test(password)
  const special = /[^A-Za-z0-9]/.test(password)
  return length && upper && lower && number && special
}

export function sanitizeName(name: string) {
  return name.replace(/[<>/]/g, "").trim()
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function generateJwt(payload: Record<string, any>) {
  const secret = process.env.JWT_SECRET || "dev-secret"
  return jwt.sign(payload, secret, { expiresIn: 3600 })
}

function randomToken(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let out = ""
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function issueCsrfToken() {
  return randomToken(48)
}

export function verifyOrigin(req: Request) {
  const origin = req.headers.get("origin") || ""
  const host = req.headers.get("host") || ""
  return origin.includes(host)
}

export function verifyCsrf(req: Request, csrfCookie: string | undefined) {
  const header = req.headers.get("x-csrf-token") || ""
  return csrfCookie && header && csrfCookie === header
}

export async function getAuthInfo(req: NextRequest | Request): Promise<{ userId: string; role: string } | null> {
  let token = ""
  const anyReq = req as any
  try {
    const c = anyReq.cookies?.get?.("auth")?.value
    if (c) token = c
  } catch {}
  if (!token) {
    const cookies = req.headers.get("cookie") || ""
    const m = /(?:^|;\s*)auth=([^;]+)/.exec(cookies)
    token = m?.[1] || ""
  }
  if (!token) return null
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret")
  try {
    const { payload } = await jwtVerify(token, secret)
    const userId = String(payload.sub || "")
    const role = String((payload as any).role || "")
    return userId ? { userId, role } : null
  } catch {
    return null
  }
}
