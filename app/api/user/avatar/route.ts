import { NextRequest, NextResponse } from "next/server"
import { getAuthInfo } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const auth = await getAuthInfo(req)
  return auth?.userId || null
}

export async function POST(request: NextRequest) {
  try {
    console.info("avatar_upload_start")
    const userId = await getAuthUserId(request)
    if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })

    const form = await request.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ message: "Arquivo não enviado" }, { status: 400 })

    const valid = ["image/png", "image/jpeg", "image/webp"]
    if (!valid.includes(file.type)) {
      console.warn("avatar_upload_invalid_type", { type: file.type })
      return NextResponse.json({ message: "Formato inválido" }, { status: 400 })
    }

    const MAX = 2 * 1024 * 1024
    if (file.size > MAX) {
      console.warn("avatar_upload_oversize", { size: file.size })
      return NextResponse.json({ message: "Arquivo acima de 2MB" }, { status: 400 })
    }

    console.info("avatar_upload_receive", { userId, type: file.type, size: file.size })
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const mime = file.type
    console.info("avatar_upload_db_upsert_begin", { userId, mime, bytes: buffer.byteLength })
    const upsert = await prisma.userAvatar.upsert({
      where: { userId },
      update: { data: buffer, mimeType: mime },
      create: { userId, data: buffer, mimeType: mime },
    })
    console.info("avatar_upload_db_upsert_done", { updatedAt: upsert.updatedAt })

    const ts = Date.now()
    const url = `/api/user/avatar?user=${encodeURIComponent(userId)}&v=${ts}`
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } })
    console.info("avatar_upload_url_set", { url })
    return NextResponse.json({ url })
  } catch (error) {
    console.error("avatar_upload_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userIdParam = request.nextUrl.searchParams.get("user")
    const userId = userIdParam || await getAuthUserId(request)
    if (!userId) return new NextResponse("Não autenticado", { status: 401 })

    const avatar = await prisma.userAvatar.findUnique({ where: { userId } })
    if (!avatar) return new NextResponse("Não encontrado", { status: 404 })

    console.info("avatar_get_success", { userId, mimeType: avatar.mimeType, bytes: (avatar.data as any)?.length || 0 })
    return new NextResponse(avatar.data as any, {
      headers: {
        "Content-Type": avatar.mimeType,
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    })
  } catch (error) {
    console.error("avatar_get_error", error)
    return new NextResponse("Erro no servidor", { status: 500 })
  }
}
