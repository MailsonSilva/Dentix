import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const displayName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.email ??
    "Usuário";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto text-center">
        <img src="/logo.png" alt="Dentix Logo" className="w-48 mx-auto mb-8" />

        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Pronto para transformar sorrisos?
        </h1>

        <p className="text-lg text-muted-foreground mb-6">
          Bem-vindo, Dr
          <span className="ml-1 text-base align-baseline">(a)</span>
          . {displayName}
        </p>

        <div className="flex justify-center">
          <Button onClick={() => navigate("/upload")}>Nova Simulação</Button>
        </div>

        <p className="text-xl text-muted-foreground mt-8">
          Aqui você pode gerenciar seus procedimentos, simulações e perfil.
        </p>

        {/* Conteúdo adicional da home pode ficar aqui */}
      </div>
    </div>
  );
};

export default Home;