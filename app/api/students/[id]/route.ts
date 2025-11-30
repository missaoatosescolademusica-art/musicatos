import { prisma } from "@/lib/db"
import { getAuthInfo } from "@/lib/auth"
import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: any }) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    const p = context.params;
    const { id } = typeof p?.then === "function" ? await p : p;
    if (!id)
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Estudante não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { message: "Erro ao buscar estudante" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: any }) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    if (!["admin", "professor"].includes(auth.role)) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }
    const body = await request.json();

    const p = context.params;
    const { id } = typeof p?.then === "function" ? await p : p;
    if (!id)
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.nameFather !== undefined) data.nameFather = body.nameFather;
    if (body.nameMother !== undefined) data.nameMother = body.nameMother;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.address !== undefined) data.address = body.address;
    if (body.instruments !== undefined) data.instruments = body.instruments;
    if (body.available !== undefined) data.available = body.available;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    const student = await prisma.student.update({
      where: { id },
      data,
    });

    return NextResponse.json(student);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Estudante não encontrado" },
          { status: 404 }
        );
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Email já registrado" },
          { status: 409 }
        );
      }
    }
    console.error("Error updating student:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar estudante" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: any }) {
  try {
    const auth = await getAuthInfo(request)
    if (!auth) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
    if (auth.role !== "admin") {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }
    const p = context.params;
    const { id } = typeof p?.then === "function" ? await p : p;
    if (!id)
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });

    const student = await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Estudante deletado com sucesso" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Estudante não encontrado" },
        { status: 404 }
      );
    }
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { message: "Erro ao deletar estudante" },
      { status: 500 }
    );
  }
}
