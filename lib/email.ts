import sgMail from "@sendgrid/mail"

export async function   sendEmailNative(to: string, subject: string, html: string) {
  const key = process.env.SENDGRID_API_KEY || ""
  const from = process.env.EMAIL_FROM || ""
  if (!key || !from || process.env.SMTP_TEST_MODE === "true") {
    console.info("email_stub - falta keys", { to, subject })
    return { ok: true, stub: true }
  }
  sgMail.setApiKey(key)
  const [res] = await sgMail.send({ to, from, subject, html })
  if (!res) {
    console.error("email_stub - erro ao enviar", { to, subject })
    return { ok: false, stub: true }
  }
  const msgId = (res && (res.headers?.["x-message-id"] || (res as any).messageId)) || ""
  console.info("email_stub - enviado", { to, subject, msgId })
  return { ok: true, messageId: msgId }
}
