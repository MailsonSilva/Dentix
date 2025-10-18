import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  nome_completo: z.string().min(3, "Nome completo é obrigatório."),
  email: z.string().email("E-mail inválido."),
  telefone: z.string().optional(),
  empresa: z.string().optional(),
  cpf_cnpj: z.string().optional(),
});

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      empresa: "",
      cpf_cnpj: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if profile doesn't exist yet
          console.error("Error fetching profile:", error);
          showError("Erro ao carregar perfil.");
        } else if (data) {
          form.reset({
            nome_completo: data.nome_completo || user.user_metadata?.full_name || "",
            email: data.email || user.email || "",
            telefone: data.telefone || "",
            empresa: data.empresa || "",
            cpf_cnpj: data.cpf_cnpj || "",
          });
        } else {
          // Pre-fill from auth data if no profile exists
          form.reset({
            nome_completo: user.user_metadata?.full_name || "",
            email: user.email || "",
            telefone: "",
            empresa: "",
            cpf_cnpj: "",
          });
        }
      }
    };

    fetchProfile();
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("usuarios")
      .update({
        nome_completo: values.nome_completo,
        email: values.email,
        telefone: values.telefone,
        empresa: values.empresa,
        cpf_cnpj: values.cpf_cnpj,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      showError("Erro ao atualizar perfil.");
      console.error("Profile update error:", error);
    } else {
      // Also update the user's email in auth if it has changed
      if (values.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: values.email });
        if (authError) {
          showError("Erro ao atualizar e-mail de login. Verifique sua caixa de entrada para confirmar a alteração.");
          console.error("Auth email update error:", authError);
        } else {
          showSuccess("Perfil atualizado! Verifique seu e-mail para confirmar a alteração de endereço.");
        }
      } else {
        showSuccess("Perfil atualizado com sucesso!");
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="nome_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="empresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf_cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </Form>

      <Separator className="my-8" />

      <div>
        <h2 className="text-lg font-semibold mb-4">Outras Ações</h2>
        <Button
          variant="outline"
          className="w-full sm:w-auto text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default Profile;