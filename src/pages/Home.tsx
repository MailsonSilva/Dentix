import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <img src="/logo.png" alt="Dentix Logo" className="w-48 mx-auto mb-8" />
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Bem-vindo, Dr. Carlos
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Pronto para transformar sorrisos?
        </p>
        <Button size="lg" onClick={() => navigate("/upload")}>
          Nova Simulação
        </Button>
      </div>
    </div>
  );
};

export default Home;