"use client"
import Link from "next/link"

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>
      <p className="mt-3 text-slate-300">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <section className="mt-8 space-y-4 text-slate-200">
        <p>
          Valorizamos a sua privacidade. Esta página descreve como coletamos, utilizamos e armazenamos
          informações, incluindo o uso de cookies necessários, de análise e de marketing.
        </p>
        <h2 className="text-xl font-semibold">Cookies</h2>
        <p>
          Utilizamos cookies necessários para garantir o funcionamento do site. Opcionalmente, você pode permitir
          cookies de análise (estatísticas de uso) e de marketing (personalização de conteúdo e campanhas).
        </p>
        <h2 className="text-xl font-semibold">Preferências</h2>
        <p>
          Você pode revisar e ajustar suas preferências de cookies a qualquer momento pelo botão flutuante exibido
          no canto da página.
        </p>
        <h2 className="text-xl font-semibold">Contato</h2>
        <p>
          Em caso de dúvidas, entre em contato com nosso suporte.
        </p>
      </section>

      <div className="mt-10">
        <Link href="/" className="text-primary underline">Voltar para o início</Link>
      </div>
    </main>
  )
}

