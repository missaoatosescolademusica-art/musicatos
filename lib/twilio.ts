export async function sendSmsTwilio(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID || ""
  const token = process.env.TWILIO_AUTH_TOKEN || ""
  const from = process.env.TWILIO_FROM_NUMBER || ""
  if (!sid || !token || !from) throw new Error("Twilio config ausente")
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
  }
  const bodyStr = new URLSearchParams({ To: to, From: from, Body: body }).toString()
  const res = await fetch(url, { method: "POST", headers, body: bodyStr })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(String(json?.message || json?.error || "Falha Twilio"))
  return json
}
