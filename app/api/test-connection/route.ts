import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    console.log("[v0] Database connection successful")
    return NextResponse.json({ message: "Conexão com banco de dados OK" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Database connection failed:", error)
    return NextResponse.json(
      {
        message: "Erro de conexão com banco de dados",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
