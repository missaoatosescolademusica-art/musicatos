import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const itemsPerPage = 10;

    const skip = (page - 1) * itemsPerPage;

    const where: Prisma.StudentWhereInput = search
      ? {
          OR: [
            {
              id: { contains: search, mode: "insensitive" as Prisma.QueryMode },
            },
            {
              fullName: {
                contains: search,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
          ],
        }
      : {};

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
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { fullName, email, phone, address, instruments, available } = body

    // Validate required fields
    if (!fullName || !email || !phone || !address || !instruments || instruments.length === 0) {
      return NextResponse.json({ message: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    console.log("[v0] Creating student with data:", { fullName, email, phone, address, instruments })

    // Check if email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email },
    })

    if (existingStudent) {
      return NextResponse.json({ message: "Este email já está registrado" }, { status: 409 })
    }

    // Create new student
    const student = await prisma.student.create({
      data: {
        fullName,
        email,
        phone,
        address,
        instruments,
        available,
      },
    })

    console.log("[v0] Student created successfully:", student.id)
    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating student:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        message: "Erro ao criar estudante",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
