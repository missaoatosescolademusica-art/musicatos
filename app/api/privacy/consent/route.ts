import { NextRequest, NextResponse } from "next/server"
import { verifyOrigin, getAuthInfo } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const ok = verifyOrigin(request)
    if (!ok) return NextResponse.json({ message: "Requisição inválida" }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const analyticsRaw = (body as any).analytics
    const marketingRaw = (body as any).marketing
    const acceptedRaw = (body as any).accepted
    const declinedRaw = (body as any).declined
    const timestamp = Number((body as any).timestamp || Date.now())
    if (![typeof analyticsRaw === "boolean", typeof marketingRaw === "boolean", typeof acceptedRaw === "boolean", typeof declinedRaw === "boolean"].every(Boolean)) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 })
    }
    const analytics = analyticsRaw as boolean
    const marketing = marketingRaw as boolean
    const accepted = acceptedRaw as boolean
    const declined = declinedRaw as boolean
    const ip = request.headers.get("x-forwarded-for") || ""
    const userAgent = request.headers.get("user-agent") || ""
    let userId: string | null = null
    try { userId = (await getAuthInfo(request))?.userId || null } catch {}

    console.info("privacy_consent_received", { analytics, marketing, accepted, declined, timestamp })

    if (process.env.PERSIST_CONSENT === "1") {
      try {
        await prisma.consentLog.create({
          data: { userId: userId || undefined, necessary: true, analytics, marketing, accepted, declined, timestamp: new Date(timestamp), ip: ip || undefined, userAgent: userAgent || undefined },
        })
        console.info("privacy_consent_persisted")
      } catch (e) {
        console.warn("privacy_consent_persist_failed", String((e as any)?.message || e))
      }
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("privacy_consent_error", error)
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 })
  }
}
