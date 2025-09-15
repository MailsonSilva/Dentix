import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Processing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate AI processing time
    const timer = setTimeout(() => {
      navigate("/result");
    }, 3000); // 3 seconds for simulation

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Gerando simulação…
        </h1>
        <p className="text-lg text-muted-foreground">
          Isso pode levar até 30 segundos
        </p>
      </div>
    </div>
  );
};

export default Processing;