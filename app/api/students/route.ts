import { prisma } from "@/lib/db";
import { getAuthInfo } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthInfo(request);
    if (!auth)
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") || "";

    if (mode === "instruments") {
      const rows = await prisma.student.findMany({
        select: { instruments: true },
      });
      const set = new Set<string>();
      for (const row of rows) {
        for (const inst of row.instruments || []) {
          if (inst) set.add(inst);
        }
      }
      return NextResponse.json({
        instruments: Array.from(set).sort(),
      });
    }

    const page = Number.parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const phone = searchParams.get("phone") || "";
    const instrument = searchParams.get("instrument") || "";
    const availableParam = searchParams.get("available");
    const available =
      availableParam === "true"
        ? true
        : availableParam === "false"
          ? false
          : undefined;
    const itemsPerPage = 10;

    const skip = (page - 1) * itemsPerPage;

    const where: Prisma.StudentWhereInput = {};

    if (search) {
      where.OR = [
        {
          id: { contains: search, mode: "insensitive" as Prisma.QueryMode },
        },
        {
          fullName: {
            contains: search,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ];
    }

    if (phone) {
      where.phone = { contains: phone, mode: "insensitive" as Prisma.QueryMode };
    }

    if (instrument) {
      where.instruments = { has: instrument };
    }

    if (typeof available === "boolean") {
      where.available = available;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: itemsPerPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / itemsPerPage);

    return NextResponse.json({
      students,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { message: "Erro ao buscar estudantes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    /*  const auth = await getAuthInfo(request);
    if (!auth)
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    if (!["admin", "professor"].includes(auth.role)) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
    } */
    const body = await request.json();

    const {
      fullName,
      nameFather,
      nameMother,
      phone,
      address,
      instruments,
      available,
      age,
    } = body;

    const ageRaw = age;
    let ageValue: number | null = null;
    if (ageRaw !== undefined && ageRaw !== null && ageRaw !== "") {
      const parsed = typeof ageRaw === "number" ? ageRaw : Number(ageRaw);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 120) {
        return NextResponse.json(
          { message: "Idade inválida" },
          { status: 400 },
        );
      }
      ageValue = parsed;
    }

    if (
      !fullName ||
      !phone ||
      !address ||
      !instruments ||
      instruments.length === 0
    ) {
      return NextResponse.json(
        { message: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    console.info("[v0] Creating student with data:", {
      fullName,
      nameFather,
      nameMother,
      phone,
      address,
      instruments,
      age: ageValue,
    });

    // Create new student
    const student = await prisma.student.create({
      data: {
        fullName,
        nameFather,
        nameMother,
        phone,
        address,
        instruments,
        available,
        age: ageValue,
      },
    });

    console.info("[v0] Student created successfully:", student.id);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error(
      "[v0] Error creating student:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      {
        message: "Erro ao criar estudante",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
