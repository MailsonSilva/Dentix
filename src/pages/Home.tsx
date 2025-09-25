import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ nome_completo: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('nome_completo')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayName = profile?.nome_completo || user?.email || "Usuário";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <img src="/logo.png" alt="Dentix Logo" className="w-48 mx-auto mb-8" />
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Bem-vindo, {displayName}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Pronto para transformar sorrisos?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/upload")}>
            Nova Simulação
          </Button>
          <Button size="lg" variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;