import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthInfo } from "@/lib/auth";
import path from "path";
import { uploadToTebi } from "@/lib/tebi";

function ensureAuthRole(role: string | undefined) {
  return role === "admin" || role === "professor";
}

function sanitizeName(name: string) {
  return name.replace(/[\r\n\t\\<>:"|?*]/g, "").trim();
}

function validYouTube(url: string) {
  const trimmed = url.trim();
  const patterns = [
    /^https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = re.exec(trimmed);
    if (m)
      return {
        ok: true,
        categoryPath: "",
        id: m[1],
        url: `https://www.youtube.com/watch?v=${m[1]}`,
      };
  }
  return { ok: false };
}

function toJsonResource(r: any) {
  return { ...r, size: r?.size != null ? Number(r.size) : null };
}

// Helper for safe audit
async function safeAudit(
  userId: string,
  action: any,
  entity: string,
  entityId: string,
  metadata?: any,
) {
  try {
    await prisma.auditLog.create({
      data: { action, entity, entityId, userId, metadata },
    });
  } catch (e) {
    console.error("AuditLog Error", e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 10)),
    );
    const type = searchParams.get("type") as any;
    const q = searchParams.get("q") || "";

    const where: any = {};
    if (type) where.type = type;
    if (q)
      where.OR = [
        { originalName: { contains: q, mode: "insensitive" } },
        { path: { contains: q, mode: "insensitive" } },
      ];

    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);
    const data = items.map(toJsonResource);
    return NextResponse.json({
      data,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("resources_list_error", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request);
    if (!auth || !ensureAuthRole(auth.role))
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 });

    const ct = (request.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      if (!file)
        return NextResponse.json(
          { message: "Arquivo não enviado" },
          { status: 400 },
        );

      const allowedMimes = [
        "application/pdf",
        "audio/mpeg",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      ];

      if (
        !allowedMimes.includes(file.type) &&
        !file.type.startsWith("image/")
      ) {
        return NextResponse.json(
          { message: "Tipo de arquivo não permitido" },
          { status: 400 },
        );
      }

      const MAX = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX)
        return NextResponse.json(
          { message: "Arquivo acima de 100MB" },
          { status: 400 },
        );

      let type: "pdf" | "mp3" = "pdf";
      if (file.type === "audio/mpeg") type = "mp3";

      const originalName = sanitizeName((file as any).name || `file.${type}`);

      // duplicidade (por nome e tamanho)
      const dup = await prisma.resource.findFirst({
        where: { originalName, size: BigInt(file.size) },
      });
      if (dup)
        return NextResponse.json(
          { message: "Recurso duplicado" },
          { status: 409 },
        );

      const buf = Buffer.from(await file.arrayBuffer());
      const ext =
        path.extname(originalName) || (type === "mp3" ? ".mp3" : ".pdf");
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const key = `${id}${ext}`;

      // Upload to Tebi ONLY
      let tebiData;
      try {
        tebiData = await uploadToTebi(buf, `resources/${key}`, file.type);
      } catch (e) {
        console.error("Tebi Upload Error", e);
        return NextResponse.json(
          {
            message: `Erro ao fazer upload para nuvem: ${(e as Error).message}`,
          },
          { status: 502 },
        );
      }

      const created = await prisma.resource.create({
        data: {
          type,
          path: tebiData.url,
          categoryPath: (form.get("categoryPath") as string) || "",
          originalName,
          size: BigInt(file.size),
          createdById: auth.userId,
          tebiId: tebiData.key,
          tebiUrl: tebiData.url,
        },
      });

      await safeAudit(auth.userId, "CREATE", "Resource", created.id, {
        type,
        path: tebiData.url,
        tebi: true,
      });

      return NextResponse.json(
        { resource: toJsonResource(created) },
        { status: 201 },
      );
    } else {
      const body = await request.json().catch(() => ({}));
      const url = String(body.url || "").trim();
      const categoryPath = String(body.categoryPath || "").trim();

      const ok = validYouTube(url);
      if (!ok.ok)
        return NextResponse.json(
          { message: "URL do YouTube inválida" },
          { status: 400 },
        );

      const validUrl = ok.url!;
      const dup = await prisma.resource.findFirst({
        where: { type: "youtube", path: validUrl },
      });
      if (dup)
        return NextResponse.json(
          { message: "Recurso duplicado" },
          { status: 409 },
        );
      const created = await prisma.resource.create({
        data: {
          type: "youtube",
          path: validUrl,
          categoryPath,
          originalName: ok.id!,
          createdById: auth.userId,
        },
      });
      await safeAudit(auth.userId, "CREATE", "Resource", created.id, {
        type: "youtube",
        path: validUrl,
      });
      return NextResponse.json(
        { resource: toJsonResource(created) },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error("resources_create_error", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
