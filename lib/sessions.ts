export type ImpersonationSession = {
  jti: string
  adminId: string
  userId: string
  role: string
  issuedAt: number
  expiresAt: number
  revoked: boolean
}

import { prisma } from "@/lib/db"
const sessions = new Map<string, ImpersonationSession>()

export async function registerImpersonation(adminId: string, userId: string, role: string, jti: string, expiresInSec: number) {
  const now = Date.now()
  const s: ImpersonationSession = {
    jti,
    adminId,
    userId,
    role,
    issuedAt: now,
    expiresAt: now + expiresInSec * 1000,
    revoked: false,
  }
  sessions.set(jti, s)
  try {
    await (prisma as any).impersonationSession.create({
      data: {
        jti,
        adminId,
        userId,
        role,
        issuedAt: new Date(s.issuedAt),
        expiresAt: new Date(s.expiresAt),
        revoked: false,
      },
    })
  } catch {}
  return s
}

export async function revokeSession(jti: string) {
  const s = sessions.get(jti)
  if (s) { s.revoked = true; sessions.set(jti, s) }
  try {
    await (prisma as any).impersonationSession.update({ where: { jti }, data: { revoked: true } })
    return true
  } catch {
    return !!s
  }
}

export async function listSessions(filter?: { adminId?: string; userId?: string }): Promise<ImpersonationSession[]> {
  const now = Date.now()
  try {
    const where: any = {}
    if (filter?.adminId) where.adminId = String(filter.adminId)
    if (filter?.userId) where.userId = String(filter.userId)
    const rows = await (prisma as any).impersonationSession.findMany({ where, orderBy: { issuedAt: "desc" }, take: 100 })
    return rows.map((r: any) => ({
      jti: String(r.jti),
      adminId: String(r.adminId),
      userId: String(r.userId),
      role: String(r.role),
      issuedAt: new Date(r.issuedAt).getTime(),
      expiresAt: new Date(r.expiresAt).getTime(),
      revoked: Boolean(r.revoked) || new Date(r.expiresAt).getTime() <= now,
    }))
  } catch {
    const arr = Array.from(sessions.values())
    return arr
      .filter((s) => !filter?.adminId || s.adminId === filter.adminId)
      .filter((s) => !filter?.userId || s.userId === filter.userId)
      .map((s) => ({ ...s, revoked: s.revoked || s.expiresAt <= now }))
  }
}

export async function isRevoked(jti?: string | null) {
  if (!jti) return false
  try {
    const r = await (prisma as any).impersonationSession.findUnique({ where: { jti } })
    if (!r) return false
    return Boolean(r.revoked) || new Date(r.expiresAt).getTime() <= Date.now()
  } catch {
    const s = sessions.get(jti)
    if (!s) return false
    return s.revoked || s.expiresAt <= Date.now()
  }
}

export async function revokeAll(filter?: { adminId?: string; userId?: string }) {
  try {
    const where: any = {}
    if (filter?.adminId) where.adminId = String(filter.adminId)
    if (filter?.userId) where.userId = String(filter.userId)
    await (prisma as any).impersonationSession.updateMany({ where, data: { revoked: true } })
    return true
  } catch {
    for (const [jti, s] of Array.from(sessions.entries())) {
      if (filter?.adminId && s.adminId !== filter.adminId) continue
      if (filter?.userId && s.userId !== filter.userId) continue
      s.revoked = true
      sessions.set(jti, s)
    }
    return true
  }
}
