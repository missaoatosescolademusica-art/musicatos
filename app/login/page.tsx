"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/csrf").catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const csrf = getCookie("csrfToken");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf || "",
        },
        body: JSON.stringify({ email, password }),
      });
      const ct = res.headers.get("content-type") || "";
      if (res.redirected) {
        window.location.replace(res.url);
        return;
      }
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (res.ok) {
          window.location.replace("/dashboard");
        } else {
          toast.error(data.message || "Credenciais inválidas");
        }
      } else {
        if (res.ok) {
          window.location.replace("/dashboard");
        } else {
          toast.error("Erro de servidor");
        }
      }
    } catch {
      toast.error("Erro de servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative text-foreground flex items-center justify-center"
      style={{
        backgroundImage: "url('/fundo-musical-login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-sm pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-4">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-xl">
          <Image
            src="/Logo.jpg"
            alt="Logo"
            width={128}
            height={128}
            className="mx-auto rounded-full"
          />
          <div className="flex items-center gap-2 mb-2 justify-center">
            <LogIn className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Entrar</h1>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-input text-foreground mt-1"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Senha</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-input text-foreground mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-2.5 text-muted-foreground"
              >
                {show ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? "Carregando..." : "Entrar"}
          </Button>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            <span>Não tem uma conta? </span>
            <a href="/register" className="text-primary hover:underline">
              Registrar-se
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : undefined;
}
