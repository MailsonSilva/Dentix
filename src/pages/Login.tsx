import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

/**
 * Try to get the current session from Supabase, polling a few times with small delays.
 * Returns the session if found, or null if not.
 */
const waitForSession = async (retries = 6, delayMs = 300) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        return data.session;
      }
    } catch (err) {
      // swallow and retry
      console.warn("getSession attempt failed:", err);
    }
    // wait before next attempt
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return null;
};

const translateSupabaseError = (message: string) => {
  const m = (message || "").toLowerCase();
  if (m.includes("email not confirmed") || m.includes("email not verified")) {
    return "E-mail não confirmado. Verifique sua caixa de entrada.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid password") || m.includes("invalid")) {
    return "E-mail ou senha inválidos.";
  }
  if (m.includes("user not found") || m.includes("no user")) {
    return "Usuário não encontrado. Verifique o e-mail informado.";
  }
  if (m.includes("too many requests")) {
    return "Muitas tentativas. Aguarde e tente novamente mais tarde.";
  }
  return "Ocorreu um erro ao tentar fazer login. Tente novamente.";
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSuccessfulLogin = () => {
    // Hard redirect to ensure AuthProvider initializes and picks up the session.
    // Using assign ensures a full reload (not client-only navigation) so the
    // provider's initial getSession will see the stored session.
    window.location.assign("/home");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const friendly = translateSupabaseError(error.message ?? "");
        console.error("signInWithPassword error:", error);
        showError(friendly);
        setSubmitting(false);
        return;
      }

      // If signInWithPassword returned a session, do a hard redirect so the AuthProvider picks it up.
      if (data?.session) {
        showSuccess("Login realizado com sucesso!");
        handleSuccessfulLogin();
        return;
      }

      // Otherwise poll getSession briefly to allow auth to propagate
      console.info("Login: session not returned immediately, polling for session...");
      const session = await waitForSession(6, 300);

      if (session) {
        console.info("Login: session found after polling.", session);
        showSuccess("Login realizado com sucesso!");
        handleSuccessfulLogin();
      } else {
        console.error("Login attempt did not produce a session. signIn response:", data);
        showError("Não foi possível iniciar a sessão. Verifique seu e-mail/senha ou confirme seu e-mail.");
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      showError("Erro inesperado ao tentar fazer login. Veja o console para detalhes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <img src="/logo.png" alt="Dentix Logo" className="w-40 mx-auto" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Seu e-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Sua senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <a href="/signup" className="underline">
              Cadastre-se
            </a>
          </div>
          <div className="mt-2 text-center text-sm">
            <a href="/forgot-password" className="underline text-muted-foreground hover:text-foreground">
              Esqueceu a senha?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;