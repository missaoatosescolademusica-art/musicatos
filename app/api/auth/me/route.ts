import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthInfo } from "@/lib/auth"
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    const id = auth.userId
    
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } })

    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })

    let avatarUrl: string | undefined = user.avatarUrl || undefined;
    if (!avatarUrl) {
      const av = await prisma.userAvatar.findUnique({
        where: { userId: user.id },
      });
      if (av) avatarUrl = `/api/user/avatar?user=${user.id}&v=${Date.now()}`;
      else {
        const pub = path.join(process.cwd(), "public", "avatars");
        const exts = ["png", "jpg", "jpeg", "webp"];
        for (const ext of exts) {
          const fp = path.join(pub, `${user.id}.${ext}`);
          if (fs.existsSync(fp)) {
            const stat = fs.statSync(fp);
            avatarUrl = `/avatars/${user.id}.${ext}?v=${stat.mtimeMs}`;
            break;
          }
        }
      }
    }

    console.info("me_auth_ok", { id: user.id, role: user.role.name })
    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role.name,
      avatarUrl,
    });
  } catch (e) {
    console.error("me_auth_error", e)
    return NextResponse.json({ message: "Token inválido" }, { status: 401 })
  }
}
