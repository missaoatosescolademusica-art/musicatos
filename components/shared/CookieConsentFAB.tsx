"use client"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Cookie } from "lucide-react"
import { toast } from "sonner"
import { readConsent, writeConsent, shouldShowConsent, markShown, validateConsentForm, postConsent } from "@/lib/cookies"

export default function CookieConsentFAB() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const existing = useMemo(() => readConsent(), []);
  const lastUpdated = existing?.timestamp
    ? new Date(existing.timestamp).toLocaleString("pt-BR")
    : null;

  useEffect(() => {
    const auto = shouldShowConsent(7 * 24 * 60 * 60 * 1000);
    if (auto) {
      setOpen(true);
      markShown();
    }
  }, []);

  useEffect(() => {
    if (existing) {
      setAnalytics(Boolean(existing.analytics));
      setMarketing(Boolean(existing.marketing));
    }
  }, []);

  const onAccept = async () => {
    const data = { analytics, marketing };
    const { valid } = validateConsentForm(data);
    if (!valid) {
      toast.error("Dados inválidos");
      return;
    }
    setSubmitting(true);
    const c = {
      necessary: true,
      analytics,
      marketing,
      accepted: true,
      declined: false,
      timestamp: Date.now(),
    };
    writeConsent(c);
    try {
      await postConsent(c);
      toast.success("Preferências salvas");
      setOpen(false);
    } catch {
      toast.error("Falha ao enviar preferências");
    } finally {
      setSubmitting(false);
    }
  };

  const onDecline = async () => {
    setSubmitting(true);
    const c = {
      necessary: true,
      analytics: false,
      marketing: false,
      accepted: false,
      declined: true,
      timestamp: Date.now(),
    };
    writeConsent(c);
    try {
      await postConsent(c);
      toast.success("Preferências salvas");
      setOpen(false);
    } catch {
      toast.error("Falha ao enviar preferências");
    } finally {
      setSubmitting(false);
    }
  };

  // Sempre exibir o botão para permitir reconfiguração das preferências

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label="Abrir preferências de cookies"
          className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 p-0 bg-slate-800 hover:bg-slate-700 shadow-xl focus-visible:ring-[3px]"
        >
          <Cookie className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-xl bg-gradient-to-br from-black to-slate-900 border border-slate-700">
        <div className="flex items-center gap-3">
          <Image
            src="/Logo.jpg"
            alt="Logo"
            width={40}
            height={40}
            className="rounded"
          />
          <div>
            <DialogHeader>
              <DialogTitle className="text-white">
                Preferências de Cookies
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Usamos cookies necessários para o funcionamento do site e
                opcionais para estatísticas e marketing.
              </DialogDescription>
              {lastUpdated && (
                <div className="mt-1 text-xs text-slate-400">
                  Última atualização: {lastUpdated}
                </div>
              )}
            </DialogHeader>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="consent-analytics"
              checked={analytics}
              onCheckedChange={(v) => setAnalytics(Boolean(v))}
            />
            <Label htmlFor="consent-analytics" className="text-slate-200">
              Permitir cookies de análise
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="consent-marketing"
              checked={marketing}
              onCheckedChange={(v) => setMarketing(Boolean(v))}
            />
            <Label htmlFor="consent-marketing" className="text-slate-200">
              Permitir cookies de marketing
            </Label>
          </div>
          <p className="text-xs text-slate-400">
            Leia nossa{" "}
            <a href="/politica-de-privacidade" className="underline">
              Política de Privacidade
            </a>{" "}
            para detalhes.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            className="bg-slate-700 border-slate-600 text-slate-200"
            onClick={onDecline}
            disabled={submitting}
          >
            Recusar
          </Button>
          <Button
            className="bg-primary"
            onClick={onAccept}
            disabled={submitting}
          >
            Aceitar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
