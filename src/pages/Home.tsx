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
    <div className="min-h-screen bg-background p-6 flex items-center">
      <div className="max-w-2xl mx-auto text-center w-full">
        <img src="/logo.png" alt="Dentix Logo" className="w-36 mx-auto mb-8" />

        <h1 className="text-5xl sm:text-6xl font-extrabold mb-2 text-foreground">
          Bem-vindo, Dr. {displayName}
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Pronto para transformar sorrisos?
        </p>

        <div className="flex justify-center">
          <Button onClick={() => navigate("/upload")} className="px-6 py-3 rounded-lg">
            Nova Simulação
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;