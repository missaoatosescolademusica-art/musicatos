import { NextRequest, NextResponse } from "next/server"

type Presence = "online" | "away" | "offline"

function compute(id: string): Presence {
  const s = Math.floor(Date.now() / 30000)
  const on = (s + id.length) % 2 === 0
  return on ? "online" : "away"
}

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids") || ""
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ statuses: [] })
    const statuses = ids.map((id) => ({ id, status: compute(id) }))
    return NextResponse.json({ statuses })
  } catch (error) {
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
