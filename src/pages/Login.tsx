import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const translateSupabaseError = (message: string) => {
  const m = message.toLowerCase();
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
  // mensagem padrão
  return "Ocorreu um erro ao tentar fazer login. Tente novamente.";
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const friendly = translateSupabaseError(authError.message ?? "");
      showError(friendly);
      setSubmitting(false);
      return;
    }

    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("usuarios")
        .select("ativo")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        showError("Não foi possível verificar o status da sua conta.");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      if (profileData.ativo) {
        showSuccess("Login realizado com sucesso!");
        navigate("/home");
      } else {
        // Apenas exibe o diálogo, não desconecta ainda
        setShowApprovalDialog(true);
      }
    }
    
    setSubmitting(false);
  };

  const handleDialogChange = (open: boolean) => {
    setShowApprovalDialog(open);
    if (!open) {
      // Desconecta o usuário QUANDO o diálogo for fechado
      supabase.auth.signOut();
    }
  };

  return (
    <>
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

      <AlertDialog open={showApprovalDialog} onOpenChange={handleDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acesso Pendente</AlertDialogTitle>
            <AlertDialogDescription>
              Sua conta foi criada e está aguardando aprovação. Para agilizar a liberação do seu acesso, entre em contato conosco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <a href="https://wa.me/5598933005102?text=Quero%20meu%2C%20acesso%20de%207%20dias." target="_blank" rel="noopener noreferrer">
                Liberar Acesso
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Login;