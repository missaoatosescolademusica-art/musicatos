import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

async function wipeDb() {
  await prisma.attendance.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.impersonationSession.deleteMany({});
  await prisma.userAvatar.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.consentLog.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
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
  ]);
  return { att, aud, pr, imp, ava, res, con, stu, usr, rol };
}

afterAll(async () => {
  const role =
    (await prisma.role.findUnique({ where: { name: "admin" } })) ||
    (await prisma.role.create({ data: { name: "admin" } }));
  const passwordHash = await hashPassword("G@bri&l442018");
  const exists = await prisma.user.findUnique({
    where: { email: "gabriel_rodrigues_perez@hotmail.com" },
  });
  if (!exists) {
    await prisma.user.create({
      data: {
        name: "Gabriel Rodrigues",
        email: "gabriel_rodrigues_perez@hotmail.com",
        passwordHash,
        roleId: role.id,
      },
    });
  }
});

describe.only("db cleanup", () => {
  it("limpa todas as tabelas e valida contagens", async () => {
    await wipeDb();
    const c = await counts();
    expect(c.att).toBe(0);
    expect(c.aud).toBe(0);
    expect(c.pr).toBe(0);
    expect(c.imp).toBe(0);
    expect(c.ava).toBe(0);
    expect(c.res).toBe(0);
    expect(c.con).toBe(0);
    expect(c.stu).toBe(0);
    expect(c.usr).toBe(0);
    expect(c.rol).toBe(0);
  }, 30000);
});
