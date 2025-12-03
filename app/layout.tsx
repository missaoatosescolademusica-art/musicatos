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
import AppShell from "@/components/shared/AppShell";
import { AuthProvider } from "@/app/dashboard/contexts/auth-context";
import { UIProvider } from "@/app/dashboard/contexts/ui-context";
import { StatusProvider } from "@/app/dashboard/contexts/status-context";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Gestão de Estudantes",
  description: "Aplicação para gerenciar estudantes de música",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <UIProvider>
              <StatusProvider>
                <AppShell>{children}</AppShell>
              </StatusProvider>
            </UIProvider>
          </AuthProvider>
        </ThemeProvider>
        <CookieConsentFAB />
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
