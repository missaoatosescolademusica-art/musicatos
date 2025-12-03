import { describe, it, expect } from "vitest"
import { prisma } from "@/lib/db"

async function wipeDb() {
  await prisma.attendance.deleteMany({})
  await prisma.auditLog.deleteMany({})
  await prisma.passwordReset.deleteMany({})
  await prisma.impersonationSession.deleteMany({})
  await prisma.userAvatar.deleteMany({})
  await prisma.resource.deleteMany({})
  await prisma.consentLog.deleteMany({})
  await prisma.student.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.role.deleteMany({})
}

async function counts() {
  const [att, aud, pr, imp, ava, res, con, stu, usr, rol] = await Promise.all([
    prisma.attendance.count(),
    prisma.auditLog.count(),
    prisma.passwordReset.count(),
    prisma.impersonationSession.count(),
    prisma.userAvatar.count(),
    prisma.resource.count(),
    prisma.consentLog.count(),
    prisma.student.count(),
    prisma.user.count(),
    prisma.role.count(),
  ])
  return { att, aud, pr, imp, ava, res, con, stu, usr, rol }
}

describe.only("db cleanup", () => {
  it("limpa todas as tabelas e valida contagens", async () => {
    await wipeDb()
    const c = await counts()
    expect(c.att).toBe(0)
    expect(c.aud).toBe(0)
    expect(c.pr).toBe(0)
    expect(c.imp).toBe(0)
    expect(c.ava).toBe(0)
    expect(c.res).toBe(0)
    expect(c.con).toBe(0)
    expect(c.stu).toBe(0)
    expect(c.usr).toBe(0)
    expect(c.rol).toBe(0)
  }, 30000)
})
