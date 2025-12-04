"use client"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/app/dashboard/contexts/auth-context"
import { InstagramIcon } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"

export default function SiteFooter() {
  const { me, authChecked } = useAuth()
  const isAuthed = authChecked && !!me
  const isAdmin = isAuthed && me?.role === "admin"
  return (
    <footer
      aria-label="Rodapé"
      className="mt-10 border-t border-slate-800/60 bg-slate-900/40 text-slate-300"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center md:justify-start justify-center">
          <Link href="/" aria-label="Página inicial">
            <Image
              src="/Logo.jpg"
              alt="Logo do site"
              width={300}
              height={300}
              className="h-30 w-auto rounded-full object-cover"
            />
          </Link>
        </div>

        <nav
          aria-label="Navegação do rodapé"
          className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm"
        >
          <Link
            href="/"
            className="px-2 py-1 rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-500"
          >
            Início
          </Link>
          <Link
            href="/politica-de-privacidade"
            className="px-2 py-1 rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-500"
          >
            Privacidade
          </Link>
          {isAuthed && (
            <div className="flex items-center gap-4">
              <span aria-hidden className="mx-1 text-slate-500">
                •
              </span>
              <Link
                href="/dashboard"
                className="px-2 py-1 rounded bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 hover:text-blue-200"
              >
                Dashboard
              </Link>
              <Link
                href="/attendance"
                className="px-2 py-1 rounded bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 hover:text-blue-200"
              >
                Lista de Chamada
              </Link>
              <Link
                href="/register"
                className="px-2 py-1 rounded bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 hover:text-blue-200"
              >
                Cadastro
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/users"
                    className="px-2 py-1 rounded bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 hover:text-purple-200"
                  >
                    Admin Usuários
                  </Link>
                  <Link
                    href="/admin/sessions"
                    className="px-2 py-1 rounded bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 hover:text-purple-200"
                  >
                    Admin Sessões
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>

        <div className="flex md:justify-end justify-center gap-4">
          <Link
            href="https://instagram.com/missaoatos_celulas"
            aria-label="Instagram oficial"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded hover:bg-slate-800/60 transition"
          >
            <InstagramIcon />
          </Link>
          <Link
            href="https://wa.me/55517991203993"
            aria-label="Contato via WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded hover:bg-slate-800/60 transition"
          >
            <FaWhatsapp size={24} />
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs md:text-sm text-slate-400">
          <span>Desenvolvido por </span>
          <Link
            href="https://gabrielrodrigues.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate-500 hover:text-slate-200 transition-colors"
          >
            Gabriel Rodrigues
          </Link>
        </div>
      </div>
    </footer>
  );
}
