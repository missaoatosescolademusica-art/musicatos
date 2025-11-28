import { prisma } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
    })

    if (!student) {
      return NextResponse.json({ message: "Estudante não encontrado" }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ message: "Erro ao buscar estudante" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        instruments: body.instruments,
        available: body.available,
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ message: "Erro ao atualizar estudante" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const student = await prisma.student.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Estudante deletado com sucesso" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ message: "Erro ao deletar estudante" }, { status: 500 })
  }
}
