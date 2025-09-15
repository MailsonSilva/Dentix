import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { originalImage, simulatedImage } = location.state || {};
  const [simulatedImageError, setSimulatedImageError] = useState(false);

  const placeholderSimulated = "https://via.placeholder.com/400x300.png?text=Simulado";
  const placeholderOriginal = "https://via.placeholder.com/400x300.png?text=Original";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Resultado da Simulação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Antes</h3>
              <img
                src={originalImage || placeholderOriginal}
                alt="Antes"
                className="rounded-lg w-full"
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Depois</h3>
              <img
                src={simulatedImageError ? placeholderSimulated : simulatedImage || placeholderSimulated}
                alt="Depois"
                className="rounded-lg w-full"
                onError={() => setSimulatedImageError(true)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/upload")}>Nova Simulação</Button>
            <Button
              variant="outline"
              onClick={() => navigate("/select-procedure")}
            >
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Result;