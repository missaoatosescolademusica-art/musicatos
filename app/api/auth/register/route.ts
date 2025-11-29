import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import {
  sanitizeName,
  validateEmail,
  validatePasswordComplexity,
  hashPassword,
  verifyOrigin,
  verifyCsrf,
  generateJwt,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const okOrigin = verifyOrigin(request);
    const csrfCookie = request.cookies.get("csrfToken")?.value;
    const okCsrf = verifyCsrf(request, csrfCookie);
    if (!okOrigin || !okCsrf) {
      console.warn("register_csrf_invalid");
      return NextResponse.json({ message: "CSRF inválido" }, { status: 403 });
    }

    const body = await request.json();
    const name = sanitizeName(String(body.name || ""));
    const email = String(body.email || "");
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const roleName = String(body.role || "user").toLowerCase();

    if (name.length < 3) {
      console.warn("register_short_name");
      return NextResponse.json(
        { message: "Nome muito curto" },
        { status: 400 }
      );
    }
    if (!validateEmail(email)) {
      console.warn("register_invalid_email", { email });
      return NextResponse.json({ message: "Email inválido" }, { status: 400 });
    }
    if (!validatePasswordComplexity(password)) {
      console.warn("register_weak_password", { email });
      return NextResponse.json({ message: "Senha fraca" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      console.warn("register_password_mismatch", { email });
      return NextResponse.json(
        { message: "Senhas diferentes" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.warn("register_email_conflict", { email });
      return NextResponse.json(
        { message: "Email já registrado" },
        { status: 409 }
      );
    }

    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
          description: roleName === "admin" ? "Administrador" : "Usuário",
        },
      });
    }

    const adminInvite = process.env.ADMIN_INVITE_SECRET;
    const headerInvite = request.headers.get("x-admin-invite") || "";
    const finalRoleId =
      roleName === "admin" && adminInvite && headerInvite === adminInvite
        ? role.id
        : (await prisma.role.findUnique({ where: { name: "user" } }))?.id ||
          role.id;

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, roleId: finalRoleId },
      include: { role: true },
    });
    const token = generateJwt({ sub: user.id, role: user.role.name });
    const res = NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 302,
    });
    res.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("register_error", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
