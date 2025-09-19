import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { originalImage, simulatedImage } = location.state || {};
  const [simulatedImageError, setSimulatedImageError] = useState(false);

  const placeholderSimulated = "/placeholder.svg";
  const placeholderOriginal = "/placeholder.svg";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-4">
          <img src="/logo.png" alt="Dentix Logo" className="w-40 mx-auto" />
          <CardTitle className="text-2xl">
            Resultado da Simulação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Situação Atual</h3>
              <div className="aspect-[4/5] overflow-hidden rounded-lg border">
                <img
                  src={originalImage || placeholderOriginal}
                  alt="Situação Atual"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Resultado Potencial</h3>
              <div className="aspect-[4/5] overflow-hidden rounded-lg border">
                <img
                  src={simulatedImageError ? placeholderSimulated : simulatedImage || placeholderSimulated}
                  alt="Resultado Potencial"
                  className="w-full h-full object-cover"
                  onError={() => setSimulatedImageError(true)}
                />
              </div>
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