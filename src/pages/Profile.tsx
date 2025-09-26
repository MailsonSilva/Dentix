import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showError, showSuccess } from "@/utils/toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const profileFormSchema = z.object({
  nome_completo: z.string().min(3, { message: "O nome completo é obrigatório." }),
  telefone: z.string().optional(),
  empresa: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  logo_url: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nome_completo: "",
      telefone: "",
      empresa: "",
      cpf_cnpj: "",
      logo_url: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setFetching(true);
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows
          throw error;
        }

        if (data) {
          form.reset({
            nome_completo: data.nome_completo || '',
            telefone: data.telefone || '',
            empresa: data.empresa || '',
            cpf_cnpj: data.cpf_cnpj || '',
            logo_url: data.logo_url || '',
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        showError("Não foi possível carregar seu perfil.");
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user, form]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          ...values,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      showSuccess("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Ocorreu um erro ao atualizar seu perfil.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input value={user?.email || ''} disabled />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
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
                    <FormLabel>Empresa / Clínica</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da sua empresa" {...field} />
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
                      <Input placeholder="Seu CPF ou CNPJ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Logo</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;