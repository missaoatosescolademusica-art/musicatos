import type React from "react"
// ... existing code ...
// <CHANGE> Updated metadata and imports
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import CookieConsentFAB from "@/components/shared/CookieConsentFAB"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestão de Estudantes",
  description: "Aplicação para gerenciar estudantes de música",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <CookieConsentFAB />
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  )
}
