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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { showError, showSuccess } from "@/utils/toast";
import { useState, useEffect } from "react";
import { Loader2, UploadCloud, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/utils/storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCpfCnpj, formatPhone } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";

const profileFormSchema = z.object({
  nome_completo: z.string().min(3, { message: "O nome completo é obrigatório." }),
  telefone: z.string().optional(),
  empresa: z.string().optional(),
  cpf_cnpj: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nome_completo: "",
      telefone: "",
      empresa: "",
      cpf_cnpj: "",
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

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          form.reset({
            nome_completo: data.nome_completo || '',
            telefone: data.telefone ? formatPhone(data.telefone) : '',
            empresa: data.empresa || '',
            cpf_cnpj: data.cpf_cnpj ? formatCpfCnpj(data.cpf_cnpj) : '',
          });
          setLogoPreview(data.logo_url || null);
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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    setLoading(true);
    try {
      const updatePayload: any = {
        ...values,
        // Remove a formatação antes de salvar no banco
        telefone: values.telefone?.replace(/\D/g, ''),
        cpf_cnpj: values.cpf_cnpj?.replace(/\D/g, ''),
        atualizado_em: new Date().toISOString(),
      };

      if (logoFile) {
        const newLogoUrl = await uploadFile(logoFile, "logos_empresas");
        updatePayload.logo_url = newLogoUrl;
      }

      const { error } = await supabase
        .from("usuarios")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) throw error;

      showSuccess("Perfil atualizado com sucesso!");
      if (updatePayload.logo_url) {
        setLogoPreview(updatePayload.logo_url);
      }
      setLogoFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Ocorreu um erro ao atualizar seu perfil.");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={logoPreview || undefined} alt="Logo" />
                    <AvatarFallback>
                      <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoChange}
                      className="max-w-xs"
                    />
                  </FormControl>
                </div>
              </FormItem>

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
                      <Input
                        placeholder="(XX) XXXXX-XXXX"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      />
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
                      <Input
                        placeholder="Seu CPF ou CNPJ"
                        {...field}
                        onChange={(e) => field.onChange(formatCpfCnpj(e.target.value))}
                      />
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
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;